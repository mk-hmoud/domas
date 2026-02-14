import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DamagesRepository } from '../repositories/damages.repository';
import { InventoryRepository } from '../../inventory/repositories/inventory.repository';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { DatabaseService } from '../../../core/database/database.service';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { CreateDamageReportDto } from '../dto/create-damage-report.dto';
import { DamageStatus } from '@domas/ts-types';

@Injectable()
export class DamagesService {
  private readonly logger = new Logger(DamagesService.name);

  constructor(
    private readonly repository: DamagesRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly locationsRepository: LocationsRepository,
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

      if (!data.snapshotId && !data.manualCostTry) {
        throw new BadRequestException('Either snapshotId or manualCostTry must be provided');
      }

      // Validate Culprits
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

      return this.repository.createReport({ ...data, reportedBy: context.userId }, client);
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
      if (report.status !== DamageStatus.PENDING)
        throw new BadRequestException('Report is already processed');

      // 1. Find Liable Students (Dynamic list at time of approval)
      let targetBookings: any[] = [];

      if (report.culpritIds && report.culpritIds.length > 0) {
        // Specifically targeted culprits
        const query = `
          SELECT b.id, b.student_id, s.nationality_code 
          FROM bookings b 
          JOIN students s ON b.student_id = s.id 
          WHERE b.student_id = ANY($1) AND b.status = 'active'
        `;
        const res = await client.query(query, [report.culpritIds]);
        targetBookings = res.rows;
      } else if (report.snapshotId) {
        // Fallback to the student specifically linked to that snapshot
        const query = `
          SELECT b.id, b.student_id, s.nationality_code, bis.price_try, bis.price_foreign, bis.foreign_currency_code
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
        const location = await this.locationsRepository.findById(report.locationId, client);
        const query = `
          SELECT b.id, b.student_id, s.nationality_code
          FROM bookings b
          JOIN beds bd ON b.bed_id = bd.id
          JOIN students s ON b.student_id = s.id
          JOIN locations l ON bd.location_id = l.id
          WHERE l.tree_path <@ $1
            AND b.status = 'active'
        `;
        const res = await client.query(query, [location!.treePath]);
        targetBookings = res.rows;
      }

      if (targetBookings.length === 0) {
        throw new BadRequestException(
          'No active students found at this location to attribute damage to.',
        );
      }

      // 2. Fetch Pricing Template
      let totalTry = 0;
      let totalForeign = 0;
      let foreignCurrency = 'EUR';

      if (report.snapshotId) {
        const sRes = await client.query(
          'SELECT price_try, price_foreign, foreign_currency_code FROM booking_inventory_snapshots WHERE id = $1',
          [report.snapshotId],
        );
        const s = sRes.rows[0];
        totalTry = parseFloat(s.price_try);
        totalForeign = parseFloat(s.price_foreign);
        foreignCurrency = s.foreign_currency_code;
      } else {
        totalTry = report.manualCostTry || 0;
        totalForeign = report.manualCostForeign || 0;
        foreignCurrency = report.manualCurrencyCode || 'EUR';
      }

      // 3. Update Report Status
      await this.repository.updateReportStatus(id, DamageStatus.APPROVED, context.userId, client);

      // 4. Create Liabilities and Transactions
      const splitDivisor = targetBookings.length;

      for (const b of targetBookings) {
        // DUAL CURRENCY LOGIC: Apply correct price per student nationality
        const isTR = b.nationality_code === 'TR';
        const studentAmount = isTR ? totalTry / splitDivisor : totalForeign / splitDivisor;
        const studentCurrency = isTR ? 'TRY' : foreignCurrency;

        // A. Record Liability
        const liability = await this.repository.createLiability(
          {
            damageReportId: report.id,
            studentId: b.student_id,
            amount: studentAmount,
            currency: studentCurrency,
          },
          client,
        );

        // B. Issue Fine (Transaction) - SET TO TRUE
        const tQuery = `
          INSERT INTO transactions (booking_id, payer_id, amount, transaction_type, is_approved, approved_by, approved_at)
          VALUES ($1, $2, $3, 'damage', TRUE, $4, NOW())
          RETURNING id
        `;
        const tRes = await client.query(tQuery, [
          b.id,
          b.student_id,
          studentAmount,
          context.userId,
        ]);

        // Link them
        await client.query('UPDATE damage_liabilities SET transaction_id = $1 WHERE id = $2', [
          tRes.rows[0].id,
          liability.id,
        ]);
      }

      this.logger.log(
        { reportId: id, studentCount: targetBookings.length },
        'Damage report approved and fines issued',
      );
    }, context);
  }

  async rejectReport(id: string, context: AuditUserContext) {
    return this.db.transaction(async (client) => {
      const report = await this.repository.findReportById(id, client);
      if (!report) throw new NotFoundException('Damage report not found');
      if (report.status !== DamageStatus.PENDING)
        throw new BadRequestException('Report is already processed');

      await this.repository.updateReportStatus(id, DamageStatus.REJECTED, context.userId, client);
    }, context);
  }
}
