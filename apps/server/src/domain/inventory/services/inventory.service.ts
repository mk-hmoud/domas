import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InventoryRepository } from '../repositories/inventory.repository';
import { InventoryCatalog } from '../entities/inventory-catalog.entity';
import { InventoryAssignment } from '../entities/inventory-assignment.entity';
import { CreateInventoryCatalogDto } from '../dto/create-inventory-catalog.dto';
import { UpdateInventoryCatalogDto } from '../dto/update-inventory-catalog.dto';
import { CreateInventoryAssignmentDto } from '../dto/create-inventory-assignment.dto';
import { UpdateInventoryAssignmentDto } from '../dto/update-inventory-assignment.dto';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PoolClient } from 'pg';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { BedsRepository } from '../../locations/repositories/beds.repository';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { BookingsRepository } from '../../bookings/repositories/bookings.repository';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly bedsRepository: BedsRepository,
    private readonly studentsRepository: StudentsRepository,
    private readonly bookingsRepository: BookingsRepository,
    @Inject(forwardRef(() => UndoService))
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
  ) {}

  // --- Catalog ---

  async createCatalog(
    data: CreateInventoryCatalogDto,
    context: AuditUserContext,
  ): Promise<InventoryCatalog> {
    this.logger.log({ nameEn: data.nameEn }, 'Creating inventory catalog item');

    return this.db.transaction(async (client) => {
      const item = await this.inventoryRepository.createCatalog(data, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.CREATE_INVENTORY_CATALOG,
          entityType: 'inventory_catalog',
          entityId: item.id.toString(),
          undoData: {},
          description: `Created inventory item ${item.nameEn}`,
        },
        client,
      );

      return item;
    }, context);
  }

  async findAllCatalog(
    filters: { scope?: string; isActive?: boolean } = {},
  ): Promise<InventoryCatalog[]> {
    return this.inventoryRepository.findAllCatalog(filters);
  }

  async findCatalogById(id: number): Promise<InventoryCatalog> {
    const item = await this.inventoryRepository.findCatalogById(id);
    if (!item) throw new NotFoundException(`Catalog item with ID ${id} not found`);
    return item;
  }

  async updateCatalog(
    id: number,
    data: UpdateInventoryCatalogDto,
    context: AuditUserContext,
  ): Promise<InventoryCatalog> {
    this.logger.log({ itemId: id }, 'Updating inventory catalog item');
    const existing = await this.findCatalogById(id);

    return this.db.transaction(async (client) => {
      const updated = await this.inventoryRepository.updateCatalog(id, data, client);
      if (!updated) throw new NotFoundException(`Catalog item with ID ${id} not found`);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_INVENTORY_CATALOG,
          entityType: 'inventory_catalog',
          entityId: id.toString(),
          undoData: existing,
          description: `Updated inventory item ${existing.nameEn}`,
        },
        client,
      );

      return updated;
    }, context);
  }

  async deleteCatalog(id: number, context: AuditUserContext): Promise<void> {
    this.logger.log({ itemId: id }, 'Deleting inventory catalog item');
    const existing = await this.findCatalogById(id);

    await this.db.transaction(async (client) => {
      await this.inventoryRepository.deleteCatalog(id, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.DELETE_INVENTORY_CATALOG,
          entityType: 'inventory_catalog',
          entityId: id.toString(),
          undoData: existing,
          description: `Deleted inventory item ${existing.nameEn}`,
        },
        client,
      );
    }, context);
  }

  // --- Assignments ---

  async createAssignment(
    data: CreateInventoryAssignmentDto,
    context: AuditUserContext,
  ): Promise<InventoryAssignment> {
    this.logger.log(
      {
        catalogId: data.catalogId,
        target: data.bedId ? `Bed ${data.bedId}` : `Location ${data.locationId}`,
      },
      'Creating inventory assignment',
    );

    if (!data.bedId && !data.locationId) {
      throw new BadRequestException('Either bedId or locationId must be provided');
    }

    const catalog = await this.findCatalogById(data.catalogId);

    if (data.bedId && catalog.scope !== 'bed') {
      throw new BadRequestException('Cannot assign non-bed scope item to a bed');
    }
    if (data.locationId && catalog.scope === 'bed') {
      throw new BadRequestException('Cannot assign bed scope item to a location');
    }

    return this.db.transaction(async (client) => {
      const assignment = await this.inventoryRepository.createAssignment(data, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.CREATE_INVENTORY_ASSIGNMENT,
          entityType: 'inventory_assignment',
          entityId: assignment.id,
          undoData: {},
          description: `Assigned ${catalog.nameEn} to ${data.bedId ? 'bed' : 'location'}`,
        },
        client,
      );

      return assignment;
    }, context);
  }

  async findAssignmentsByLocation(locationId: number): Promise<InventoryAssignment[]> {
    return this.inventoryRepository.findAssignmentsByLocation(locationId);
  }

  async findAssignmentsByBed(bedId: number): Promise<InventoryAssignment[]> {
    return this.inventoryRepository.findAssignmentsByBed(bedId);
  }

  async updateAssignment(
    id: string,
    data: UpdateInventoryAssignmentDto,
    context: AuditUserContext,
  ): Promise<InventoryAssignment> {
    // Note: Inventory assignments are UUID based
    const existing = await this.inventoryRepository.findAssignmentWithItem(id);
    if (!existing) throw new NotFoundException(`Assignment with ID ${id} not found`);

    return this.db.transaction(async (client) => {
      const updated = await this.inventoryRepository.updateAssignment(id, data, client);
      if (!updated) throw new NotFoundException(`Assignment with ID ${id} not found`);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_INVENTORY_ASSIGNMENT,
          entityType: 'inventory_assignment',
          entityId: id,
          undoData: existing,
          description: `Updated assignment of ${existing.item.name_en}`,
        },
        client,
      );

      return updated;
    }, context);
  }

  async deleteAssignment(id: string, context: AuditUserContext): Promise<void> {
    const existing = await this.inventoryRepository.findAssignmentWithItem(id);
    if (!existing) throw new NotFoundException(`Assignment with ID ${id} not found`);

    await this.db.transaction(async (client) => {
      await this.inventoryRepository.deleteAssignment(id, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.DELETE_INVENTORY_ASSIGNMENT,
          entityType: 'inventory_assignment',
          entityId: id,
          undoData: existing,
          description: `Removed assignment of ${existing.item.name_en}`,
        },
        client,
      );
    }, context);
  }

  // --- Snapshot Logic ---

  async getAvailableExtras(): Promise<any[]> {
    return this.inventoryRepository.findAvailableExtras();
  }

  async generateSnapshotForBooking(
    bookingId: string,
    bedId: number,
    selectedExtraCatalogIds: number[] = [],
    context: AuditUserContext,
    client: PoolClient,
  ): Promise<void> {
    this.logger.log(
      { bookingId, bedId, extrasCount: selectedExtraCatalogIds.length },
      'Generating inventory snapshot for booking',
    );

    const bed = await this.bedsRepository.findById(bedId, client);
    if (!bed) throw new Error('Bed not found');

    const booking = await this.bookingsRepository.findById(bookingId, client);
    if (!booking) throw new Error('Booking not found');

    const student = await this.studentsRepository.findById(booking.studentId, client);
    if (!student) throw new Error('Student not found');

    const isTR = student.nationalityCode === 'TR';

    const ancestors = await this.locationsRepository.findWithAncestors(bed.locationId, client);
    const locationIds = ancestors.map((a) => a.id);

    const mandatoryItems = await this.inventoryRepository.findMandatoryAssignmentsForSnapshot(
      bedId,
      locationIds,
      client,
    );

    const optionalItems = await this.inventoryRepository.findOptionalCatalogItems(
      selectedExtraCatalogIds,
      client,
    );

    const allItems = [...mandatoryItems, ...optionalItems];

    const snapshots = allItems.map((r) => ({
      bookingId,
      catalogId: r.catalog_id,
      nameTr: r.name_tr,
      nameEn: r.name_en,
      descriptionTr: r.description_tr,
      descriptionEn: r.description_en,
      scope: r.scope,
      quantity: r.quantity,
      locationName: r.target_name,
    }));

    if (snapshots.length > 0) {
      await this.inventoryRepository.createSnapshots(snapshots, client);
    }
  }

  async findSnapshotsByBooking(bookingId: string): Promise<any[]> {
    return this.inventoryRepository.findSnapshotsByBooking(bookingId);
  }

  async findActiveSnapshotsByLocation(locationId: number): Promise<any[]> {
    return this.inventoryRepository.findActiveSnapshotsByLocation(locationId);
  }

  async getMixedInventory(locationId: number) {
    return this.inventoryRepository.findMixedInventoryByLocation(locationId);
  }
}
