import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly bedsRepository: BedsRepository,
    private readonly db: DatabaseService,
  ) {}

  // --- Catalog ---

  async createCatalog(
    data: CreateInventoryCatalogDto,
    context: AuditUserContext,
  ): Promise<InventoryCatalog> {
    this.logger.log({ nameEn: data.nameEn }, 'Creating inventory catalog item');
    return this.inventoryRepository.createCatalog(data);
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
    const updated = await this.inventoryRepository.updateCatalog(id, data);
    if (!updated) throw new NotFoundException(`Catalog item with ID ${id} not found`);
    return updated;
  }

  async deleteCatalog(id: number, context: AuditUserContext): Promise<void> {
    this.logger.log({ itemId: id }, 'Deleting inventory catalog item');
    await this.inventoryRepository.deleteCatalog(id);
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

    return this.inventoryRepository.createAssignment(data);
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
    const updated = await this.inventoryRepository.updateAssignment(id, data);
    if (!updated) throw new NotFoundException(`Assignment with ID ${id} not found`);
    return updated;
  }

  async deleteAssignment(id: string, context: AuditUserContext): Promise<void> {
    await this.inventoryRepository.deleteAssignment(id);
  }

  // --- Snapshot Logic ---

  async generateSnapshotForBooking(
    bookingId: string,
    bedId: number,
    context: AuditUserContext,
    client: PoolClient,
  ): Promise<void> {
    this.logger.log({ bookingId, bedId }, 'Generating inventory snapshot for booking');

    const bed = await this.bedsRepository.findById(bedId, client);
    if (!bed) throw new Error('Bed not found');

    const ancestors = await this.locationsRepository.findWithAncestors(bed.locationId, client);
    const locationIds = ancestors.map((a) => a.id);

    const query = `
      SELECT a.*, 
             row_to_json(c.*) as item,
             COALESCE(l.name, 'Bed ' || b.label) as target_name
      FROM inventory_assignments a
      JOIN inventory_catalog c ON a.catalog_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN beds b ON a.bed_id = b.id
      WHERE (a.bed_id = $1 OR a.location_id = ANY($2))
        AND c.is_active = TRUE 
        AND c.deleted_at IS NULL
      ORDER BY c.scope DESC, c.name_en ASC
    `;
    const result = await client.query(query, [bedId, locationIds]);

    const snapshots = result.rows.map((r) => ({
      bookingId,
      catalogId: r.catalog_id,
      nameTr: r.item.name_tr,
      nameEn: r.item.name_en,
      descriptionTr: r.item.description_tr,
      descriptionEn: r.item.description_en,
      scope: r.item.scope,
      priceTry: r.item.base_price_try,
      priceForeign: r.item.base_price_foreign,
      foreignCurrencyCode: r.item.foreign_currency_code,
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
}
