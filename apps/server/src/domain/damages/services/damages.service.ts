import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DamagesRepository } from '../repositories/damages.repository';
import { InventoryRepository } from '../../inventory/repositories/inventory.repository';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { DatabaseService } from '../../../core/database/database.service';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { CreateDamageReportDto } from '../dto/create-damage-report.dto';
import { DamageStatus } from '../../../common/enums/damage-status.enum';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { UndoService } from '../../audit/services/undo.service';
import { DamageReport } from '../entities/damage-report.entity';
import { PoolClient } from 'pg';

import { PERMISSIONS } from '../../../common/constants/permissions';

@Injectable()
export class DamagesService {
  private readonly logger = new Logger(DamagesService.name);

  constructor(
    private readonly repository: DamagesRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly locationsRepository: LocationsRepository,
    @Inject(forwardRef(() => UndoService))
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * STEP 1: Staff reports the incident.
   * No financial impact yet.
   */
  async createReport(data: CreateDamageReportDto, context: AuditUserContext) {
    return this.db.transaction(async (client) => {
      // Basic validation: ensure location exists
      const location = await this.locationsRepository.findById(data.locationId, client);
      if (!location) throw new NotFoundException('Location not found');

      // If snapshotId is provided, validate it exists
      if (data.snapshotId) {
        const snapshot = await client.query(
          'SELECT 1 FROM booking_inventory_snapshots WHERE id = $1',
          [data.snapshotId],
        );
        if (snapshot.rowCount === 0) throw new NotFoundException('Inventory snapshot not found');
      }

      // If catalogId is provided, validate it exists
      if (data.catalogId) {
        const catalogItem = await this.inventoryRepository.findCatalogById(data.catalogId);
        if (!catalogItem) throw new NotFoundException('Catalog item not found');
      }

      if (!data.snapshotId && !data.catalogId && !data.manualCostTry) {
        throw new BadRequestException(
          'Either snapshotId, catalogId or manualCostTry must be provided',
        );
      }

      // Validate student culprits
      if (data.culpritIds && data.culpritIds.length > 0) {
        for (const studentId of data.culpritIds) {
          const student = await client.query(
            'SELECT 1 FROM students WHERE id = $1 AND deleted_at IS NULL',
            [studentId],
          );
          if (student.rowCount === 0) throw new NotFoundException(`Student ${studentId} not found`);

          const booking = await client.query(
            "SELECT 1 FROM bookings WHERE student_id = $1 AND status = 'active'",
            [studentId],
          );
          if (booking.rowCount === 0)
            throw new BadRequestException(`Student ${studentId} does not have an active booking`);
        }
      }

      // Validate guest culprits
      if (data.culpritGuestStayIds && data.culpritGuestStayIds.length > 0) {
        for (const stayId of data.culpritGuestStayIds) {
          const stay = await client.query(
            "SELECT 1 FROM guest_stays WHERE id = $1 AND status IN ('confirmed', 'active')",
            [stayId],
          );
          if (stay.rowCount === 0)
            throw new NotFoundException(`Guest stay ${stayId} not found or not active`);
        }
      }

      const report = await this.repository.createReport(
        { ...data, reportedBy: context.userId },
        client,
      );

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.CREATE_DAMAGE_REPORT,
          entityType: 'damage_report',
          entityId: report.id,
          undoData: {},
          description: `Created damage report for location ${data.locationId}`,
        },
        client,
      );

      // AUTO-APPROVE Logic
      if (data.autoApprove) {
        const canApprove =
          context.permissions?.includes(PERMISSIONS.DAMAGES_MANAGE) || context.isRecoveryAdmin;
        if (canApprove) {
          this.logger.log({ reportId: report.id }, 'Triggering auto-approval for damage report');
          await this.processApproval(report, context, client, true); // skipUndo
        } else {
          this.logger.warn(
            { userId: context.userId },
            'User attempted auto-approve without permissions',
          );
        }
      }

      return report;
    }, context);
  }

  async findReportById(id: string) {
    const report = await this.repository.findReportById(id);
    if (!report) throw new NotFoundException('Damage report not found');
    const liabilities = await this.repository.findLiabilitiesByReport(id);
    return { ...report, liabilities };
  }

  async findAllReports(filters: { status?: DamageStatus; locationId?: number }) {
    return this.repository.findAllReports(filters);
  }

  /**
   * STEP 2: Manager reviews and approves.
   * This is where the price is calculated per student and fines are issued.
   */
  async approveReport(id: string, context: AuditUserContext) {
    return this.db.transaction(async (client) => {
      const report = await this.repository.findReportById(id, client);
      if (!report) throw new NotFoundException('Damage report not found');
      if (report.status !== DamageStatus.PENDING) {
        this.logger.warn(
          { reportId: id, status: report.status },
          'Attempted to approve a non-pending report',
        );
        throw new BadRequestException('Report is already processed');
      }

      await this.processApproval(report, context, client);
    }, context);
  }

  private async processApproval(
    report: DamageReport,
    context: AuditUserContext,
    client: PoolClient,
    skipUndo = false,
  ) {
    // 1. Find Liable Students (Dynamic list at time of approval)
    let targetBookings: any[] = [];

    if (report.culpritIds && report.culpritIds.length > 0) {
      this.logger.log(
        { reportId: report.id, culprits: report.culpritIds },
        'Searching for specific culprits',
      );
      const query = `
        SELECT b.id, b.student_id, s.nationality_code 
        FROM bookings b 
        JOIN students s ON b.student_id = s.id 
        WHERE b.student_id = ANY($1) AND b.status = 'active'
      `;
      const res = await client.query(query, [report.culpritIds]);
      targetBookings = res.rows;
    } else if (report.snapshotId) {
      this.logger.log(
        { reportId: report.id, snapshotId: report.snapshotId },
        'Searching for student via snapshot',
      );
      const query = `
        SELECT b.id, b.student_id, s.nationality_code
        FROM booking_inventory_snapshots bis
        JOIN bookings b ON bis.booking_id = b.id
        JOIN students s ON b.student_id = s.id
        WHERE bis.id = $1 AND b.status = 'active'
      `;
      const res = await client.query(query, [report.snapshotId]);
      targetBookings = res.rows;
    }

    // If no culprits and no specific snapshot student found, fallback to location-based group liability
    if (targetBookings.length === 0) {
      this.logger.log(
        { reportId: report.id, locationId: report.locationId },
        'No specific targets found, falling back to location residents',
      );
      const location = await this.locationsRepository.findById(report.locationId, client);
      if (!location) throw new NotFoundException('Location not found');

      const query = `
        SELECT b.id, b.student_id, s.nationality_code
        FROM bookings b
        JOIN beds bd ON b.bed_id = bd.id
        JOIN students s ON b.student_id = s.id
        JOIN locations l ON bd.location_id = l.id
        WHERE l.tree_path <@ (SELECT tree_path FROM locations WHERE id = $1)
          AND b.status = 'active'
      `;
      const res = await client.query(query, [report.locationId]);
      targetBookings = res.rows;
    }

    // 1b. Resolve guest culprits
    let targetGuestStays: any[] = [];
    if (report.culpritGuestStayIds && report.culpritGuestStayIds.length > 0) {
      const res = await client.query(`SELECT id FROM guest_stays WHERE id = ANY($1)`, [
        report.culpritGuestStayIds,
      ]);
      targetGuestStays = res.rows;
    }

    this.logger.log(
      {
        reportId: report.id,
        studentCount: targetBookings.length,
        guestCount: targetGuestStays.length,
      },
      'Target culprits identified',
    );

    if (targetBookings.length === 0 && targetGuestStays.length === 0) {
      throw new BadRequestException('No active students or guests found to attribute damage to.');
    }

    // 2. Fetch LIVE Pricing from Catalog or Report
    let currentPriceTry = 0;
    let currentPriceForeign = 0;
    let foreignCurrency = 'EUR';

    if (report.snapshotId) {
      // Fetch current live price from catalog via snapshot
      const catalogItem = await this.inventoryRepository.findCatalogItemBySnapshot(
        Number(report.snapshotId),
        client,
      );
      if (!catalogItem) throw new NotFoundException('Catalog item not found for snapshot');

      currentPriceTry = Number(catalogItem.current_price_try);
      currentPriceForeign = Number(catalogItem.current_price_foreign);
      foreignCurrency = catalogItem.foreign_currency_code;
    } else if (report.catalogId) {
      // Fetch current live price directly from catalog
      const catalogItem = await this.inventoryRepository.findCatalogById(report.catalogId, client);
      if (!catalogItem) throw new NotFoundException('Catalog item not found');

      currentPriceTry = Number(catalogItem.basePriceTry);
      currentPriceForeign = Number(catalogItem.basePriceForeign);
      foreignCurrency = catalogItem.foreignCurrencyCode;
    } else {
      currentPriceTry = Number(report.manualCostTry || 0);
      currentPriceForeign = Number(report.manualCostForeign || 0);
      foreignCurrency = report.manualCurrencyCode || 'EUR';
    }

    // 3. Update Report Status
    await this.repository.updateReportStatus(
      report.id,
      DamageStatus.APPROVED,
      context.userId,
      client,
    );

    // 4. Create Liabilities
    const splitDivisor = targetBookings.length + targetGuestStays.length;

    for (const b of targetBookings) {
      const isTR = b.nationality_code === 'TR';
      const studentAmount = isTR
        ? currentPriceTry / splitDivisor
        : currentPriceForeign / splitDivisor;
      const studentCurrency = isTR ? 'TRY' : foreignCurrency;

      await this.repository.createLiability(
        {
          damageReportId: report.id,
          studentId: b.student_id,
          amount: studentAmount,
          currency: studentCurrency,
        },
        client,
      );
    }

    for (const gs of targetGuestStays) {
      await this.repository.createLiability(
        {
          damageReportId: report.id,
          guestStayId: gs.id,
          amount: currentPriceTry / splitDivisor,
          currency: 'TRY',
        },
        client,
      );
    }

    if (!skipUndo) {
      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.APPROVE_DAMAGE_REPORT,
          entityType: 'damage_report',
          entityId: report.id,
          undoData: { previousStatus: report.status },
          description: `Approved damage report ${report.id}`,
        },
        client,
      );
    }

    this.logger.log(
      { reportId: report.id, studentCount: targetBookings.length },
      'Damage report approved and liabilities created',
    );
  }

  async rejectReport(id: string, context: AuditUserContext) {
    return this.db.transaction(async (client) => {
      const report = await this.repository.findReportById(id, client);
      if (!report) throw new NotFoundException('Damage report not found');
      if (report.status !== DamageStatus.PENDING)
        throw new BadRequestException('Report is already processed');

      await this.repository.updateReportStatus(id, DamageStatus.REJECTED, context.userId, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.REJECT_DAMAGE_REPORT,
          entityType: 'damage_report',
          entityId: id,
          undoData: { previousStatus: report.status },
          description: `Rejected damage report ${id}`,
        },
        client,
      );
    }, context);
  }
}
