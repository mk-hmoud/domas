import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { InventoryCatalog } from '../entities/inventory-catalog.entity';
import { InventoryAssignment } from '../entities/inventory-assignment.entity';
import { BookingInventorySnapshot } from '../entities/booking-inventory-snapshot.entity';
import { CreateInventoryCatalogDto } from '../dto/create-inventory-catalog.dto';
import { UpdateInventoryCatalogDto } from '../dto/update-inventory-catalog.dto';
import { CreateInventoryAssignmentDto } from '../dto/create-inventory-assignment.dto';
import { UpdateInventoryAssignmentDto } from '../dto/update-inventory-assignment.dto';

@Injectable()
export class InventoryRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  private getCatalogSelectColumns(alias = 'c'): string {
    const prefix = alias ? `${alias}.` : '';
    return `
      ${prefix}id,
      ${prefix}name_tr as "nameTr",
      ${prefix}name_en as "nameEn",
      ${prefix}description_tr as "descriptionTr",
      ${prefix}description_en as "descriptionEn",
      ${prefix}scope,
      ${prefix}base_price_try as "basePriceTry",
      ${prefix}base_price_foreign as "basePriceForeign",
      ${prefix}foreign_currency_code as "foreignCurrencyCode",
      ${prefix}is_active as "isActive",
      ${prefix}is_optional as "isOptional",
      ${prefix}created_at as "createdAt",
      ${prefix}updated_at as "updatedAt"
    `;
  }

  private getAssignmentSelectColumns(alias = 'a'): string {
    const prefix = alias ? `${alias}.` : '';
    return `
      ${prefix}id,
      ${prefix}catalog_id as "catalogId",
      ${prefix}location_id as "locationId",
      ${prefix}bed_id as "bedId",
      ${prefix}quantity,
      ${prefix}notes,
      ${prefix}created_at as "createdAt",
      ${prefix}updated_at as "updatedAt"
    `;
  }

  private getSnapshotSelectColumns(alias = 's'): string {
    const prefix = alias ? `${alias}.` : '';
    return `
      ${prefix}id,
      ${prefix}booking_id as "bookingId",
      ${prefix}catalog_id as "catalogId",
      ${prefix}name_tr as "nameTr",
      ${prefix}name_en as "nameEn",
      ${prefix}description_tr as "descriptionTr",
      ${prefix}description_en as "descriptionEn",
      ${prefix}scope,
      ${prefix}price_try as "priceTry",
      ${prefix}price_foreign as "priceForeign",
      ${prefix}foreign_currency_code as "foreignCurrencyCode",
      ${prefix}quantity,
      ${prefix}location_name as "locationName",
      ${prefix}checkin_recorded_at as "checkinRecordedAt",
      ${prefix}checkin_recorded_by as "checkinRecordedBy",
      ${prefix}checkout_recorded_at as "checkoutRecordedAt",
      ${prefix}checkout_recorded_by as "checkoutRecordedBy",
      ${prefix}is_damaged as "isDamaged",
      ${prefix}damage_note as "damageNote",
      ${prefix}created_at as "createdAt",
      ${prefix}updated_at as "updatedAt"
    `;
  }

  // --- Catalog ---

  async createCatalog(
    data: CreateInventoryCatalogDto,
    client?: PoolClient,
  ): Promise<InventoryCatalog> {
    const query = `
      INSERT INTO inventory_catalog (
        name_tr, name_en, description_tr, description_en, scope, 
        base_price_try, base_price_foreign, foreign_currency_code, 
        is_active, is_optional
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING ${this.getCatalogSelectColumns(null as any)}
    `;
    const values = [
      data.nameTr,
      data.nameEn,
      data.descriptionTr || null,
      data.descriptionEn || null,
      data.scope,
      data.basePriceTry,
      data.basePriceForeign,
      data.foreignCurrencyCode,
      data.isActive !== undefined ? data.isActive : true,
      data.isOptional !== undefined ? data.isOptional : false,
    ];

    const result = await this.getClient(client).query(query, values);
    return new InventoryCatalog(result.rows[0]);
  }

  async findAllCatalog(
    filters: { scope?: string; isActive?: boolean } = {},
  ): Promise<InventoryCatalog[]> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const values: any[] = [];

    if (filters.scope) {
      conditions.push(`scope = $${values.length + 1}`);
      values.push(filters.scope);
    }

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${values.length + 1}`);
      values.push(filters.isActive);
    }

    const query = `
      SELECT ${this.getCatalogSelectColumns('c')}
      FROM inventory_catalog c
      WHERE ${conditions.join(' AND ')}
      ORDER BY name_en ASC
    `;

    const result = await this.db.query(query, values);
    return result.rows.map((r) => new InventoryCatalog(r));
  }

  async findCatalogById(id: number, client?: PoolClient): Promise<InventoryCatalog | null> {
    const query = `
      SELECT ${this.getCatalogSelectColumns('c')}
      FROM inventory_catalog c 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ? new InventoryCatalog(result.rows[0]) : null;
  }

  async updateCatalog(
    id: number,
    data: UpdateInventoryCatalogDto,
    client?: PoolClient,
  ): Promise<InventoryCatalog | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const mapping: Record<string, string> = {
      nameTr: 'name_tr',
      nameEn: 'name_en',
      descriptionTr: 'description_tr',
      descriptionEn: 'description_en',
      scope: 'scope',
      basePriceTry: 'base_price_try',
      basePriceForeign: 'base_price_foreign',
      foreignCurrencyCode: 'foreign_currency_code',
      isActive: 'is_active',
      isOptional: 'is_optional',
    };

    for (const [key, column] of Object.entries(mapping)) {
      if (data[key as keyof UpdateInventoryCatalogDto] !== undefined) {
        updates.push(`${column} = $${paramIndex++}`);
        values.push(data[key as keyof UpdateInventoryCatalogDto]);
      }
    }

    if (updates.length === 0) return this.findCatalogById(id, client);

    values.push(id);
    const query = `
      UPDATE inventory_catalog
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING ${this.getCatalogSelectColumns(null as any)}
    `;

    const result = await this.getClient(client).query(query, values);
    return result.rows[0] ? new InventoryCatalog(result.rows[0]) : null;
  }

  async deleteCatalog(id: number, client?: PoolClient): Promise<void> {
    const query = `UPDATE inventory_catalog SET deleted_at = NOW() WHERE id = $1`;
    await this.getClient(client).query(query, [id]);
  }

  // --- Assignments ---

  async createAssignment(
    data: CreateInventoryAssignmentDto,
    client?: PoolClient,
  ): Promise<InventoryAssignment> {
    const query = `
      INSERT INTO inventory_assignments (catalog_id, location_id, bed_id, quantity, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${this.getAssignmentSelectColumns(null as any)}
    `;
    const values = [
      data.catalogId,
      data.locationId || null,
      data.bedId || null,
      data.quantity,
      data.notes || null,
    ];

    const result = await this.getClient(client).query(query, values);
    return new InventoryAssignment(result.rows[0]);
  }

  async findAssignmentsByLocation(locationId: number): Promise<InventoryAssignment[]> {
    const query = `
      SELECT ${this.getAssignmentSelectColumns('a')}, 
             row_to_json(c.*) as item_raw
      FROM inventory_assignments a
      JOIN inventory_catalog c ON a.catalog_id = c.id
      WHERE a.location_id = $1
    `;
    const result = await this.db.query(query, [locationId]);
    return result.rows.map((r) => {
      const assignment = new InventoryAssignment(r);
      if (r.item_raw) {
        assignment.item = new InventoryCatalog({
          id: r.item_raw.id,
          nameTr: r.item_raw.name_tr,
          nameEn: r.item_raw.name_en,
          descriptionTr: r.item_raw.description_tr,
          descriptionEn: r.item_raw.description_en,
          scope: r.item_raw.scope,
          basePriceTry: r.item_raw.base_price_try,
          basePriceForeign: r.item_raw.base_price_foreign,
          foreignCurrencyCode: r.item_raw.foreign_currency_code,
          isActive: r.item_raw.is_active,
          createdAt: r.item_raw.created_at,
          updatedAt: r.item_raw.updated_at,
        });
      }
      return assignment;
    });
  }

  async findAssignmentsByBed(bedId: number): Promise<InventoryAssignment[]> {
    const query = `
      SELECT ${this.getAssignmentSelectColumns('a')}, 
             row_to_json(c.*) as item_raw
      FROM inventory_assignments a
      JOIN inventory_catalog c ON a.catalog_id = c.id
      WHERE a.bed_id = $1
    `;
    const result = await this.db.query(query, [bedId]);
    return result.rows.map((r) => {
      const assignment = new InventoryAssignment(r);
      if (r.item_raw) {
        assignment.item = new InventoryCatalog({
          id: r.item_raw.id,
          nameTr: r.item_raw.name_tr,
          nameEn: r.item_raw.name_en,
          descriptionTr: r.item_raw.description_tr,
          descriptionEn: r.item_raw.description_en,
          scope: r.item_raw.scope,
          basePriceTry: r.item_raw.base_price_try,
          basePriceForeign: r.item_raw.base_price_foreign,
          foreignCurrencyCode: r.item_raw.foreign_currency_code,
          isActive: r.item_raw.is_active,
          createdAt: r.item_raw.created_at,
          updatedAt: r.item_raw.updated_at,
        });
      }
      return assignment;
    });
  }

  async findAssignmentWithItem(id: string, client?: PoolClient): Promise<any | null> {
    const query = `
      SELECT a.*, row_to_json(c.*) as item 
      FROM inventory_assignments a 
      JOIN inventory_catalog c ON a.catalog_id = c.id 
      WHERE a.id = $1
    `;
    const res = await this.getClient(client).query(query, [id]);
    return res.rows[0] || null;
  }

  async updateAssignment(
    id: string,
    data: UpdateInventoryAssignmentDto,
    client?: PoolClient,
  ): Promise<InventoryAssignment | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`);
      values.push(data.quantity);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) {
      const query = `SELECT ${this.getAssignmentSelectColumns(null as any)} FROM inventory_assignments WHERE id = $1`;
      const res = await this.getClient(client).query(query, [id]);
      return res.rows[0] ? new InventoryAssignment(res.rows[0]) : null;
    }

    values.push(id);
    const query = `
      UPDATE inventory_assignments
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING ${this.getAssignmentSelectColumns(null as any)}
    `;
    const result = await this.getClient(client).query(query, values);
    return result.rows[0] ? new InventoryAssignment(result.rows[0]) : null;
  }

  async deleteAssignment(id: string, client?: PoolClient): Promise<void> {
    await this.getClient(client).query('DELETE FROM inventory_assignments WHERE id = $1', [id]);
  }

  // --- Snapshots ---

  async createSnapshots(
    snapshots: Partial<BookingInventorySnapshot>[],
    client?: PoolClient,
  ): Promise<void> {
    if (snapshots.length === 0) return;

    const values: any[] = [];
    const rows: string[] = [];
    let paramIndex = 1;

    for (const s of snapshots) {
      rows.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`,
      );
      values.push(
        s.bookingId,
        s.catalogId,
        s.nameTr,
        s.nameEn,
        s.descriptionTr || null,
        s.descriptionEn || null,
        s.scope,
        s.priceTry,
        s.priceForeign,
        s.foreignCurrencyCode,
        s.quantity,
        s.locationName || null,
      );
    }

    const query = `
      INSERT INTO booking_inventory_snapshots (
        booking_id, catalog_id, name_tr, name_en, description_tr, description_en, 
        scope, price_try, price_foreign, foreign_currency_code, quantity, location_name
      )
      VALUES ${rows.join(', ')}
    `;

    await this.getClient(client).query(query, values);
  }

  async findSnapshotsByBooking(
    bookingId: string,
    client?: PoolClient,
  ): Promise<BookingInventorySnapshot[]> {
    const query = `
      SELECT ${this.getSnapshotSelectColumns('s')}
      FROM booking_inventory_snapshots s
      WHERE booking_id = $1 
      ORDER BY scope DESC, name_en ASC
    `;
    const result = await this.getClient(client).query(query, [bookingId]);
    return result.rows.map((r) => new BookingInventorySnapshot(r));
  }

  async findAvailableExtras(): Promise<any[]> {
    const query = `
      SELECT id, 
             name_tr as "nameTr",
             name_en as "nameEn",
             base_price_try as "basePriceTry",
             base_price_foreign as "basePriceForeign",
             foreign_currency_code as "foreignCurrencyCode",
             'global_optional' as type
      FROM inventory_catalog
      WHERE is_optional = TRUE
        AND is_active = TRUE
        AND deleted_at IS NULL
      ORDER BY name_en ASC
    `;

    const result = await this.db.query(query);
    return result.rows;
  }

  async findMandatoryAssignmentsForSnapshot(
    bedId: number,
    locationIds: number[],
    client?: PoolClient,
  ): Promise<any[]> {
    const query = `
      SELECT a.catalog_id, a.quantity, 
             c.name_tr, c.name_en, c.description_tr, c.description_en,
             c.base_price_try, c.base_price_foreign, c.foreign_currency_code, c.scope,
             COALESCE(l.name, 'Bed ' || b.label) as target_name
      FROM inventory_assignments a
      JOIN inventory_catalog c ON a.catalog_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN beds b ON a.bed_id = b.id
      WHERE (a.bed_id = $1 OR a.location_id = ANY($2))
        AND c.is_active = TRUE 
        AND c.deleted_at IS NULL
    `;
    const result = await this.getClient(client).query(query, [bedId, locationIds]);
    return result.rows;
  }

  async findOptionalCatalogItems(catalogIds: number[], client?: PoolClient): Promise<any[]> {
    if (catalogIds.length === 0) return [];
    const query = `
      SELECT id as catalog_id, 
             1 as quantity,
             name_tr, name_en, description_tr, description_en,
             base_price_try, base_price_foreign, foreign_currency_code, scope,
             'Personal Rental' as target_name
      FROM inventory_catalog
      WHERE id = ANY($1) 
        AND is_optional = TRUE
        AND is_active = TRUE
        AND deleted_at IS NULL
    `;
    const res = await this.getClient(client).query(query, [catalogIds]);
    return res.rows;
  }
}
