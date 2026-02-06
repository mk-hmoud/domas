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

  // --- Catalog ---

  async createCatalog(
    data: CreateInventoryCatalogDto,
    client?: PoolClient,
  ): Promise<InventoryCatalog> {
    const query = `
      INSERT INTO inventory_catalog (
        name_tr, name_en, description_tr, description_en, scope, 
        base_price_try, base_price_foreign, foreign_currency_code, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      data.nameTr,
      data.nameEn,
      data.descriptionTr || null,
      data.descriptionEn || null,
      data.scope,
      data.basePriceTry,
      data.basePriceForeign,
      data.foreignCurrencyCode || 'EUR',
      data.isActive !== undefined ? data.isActive : true,
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
      SELECT * FROM inventory_catalog
      WHERE ${conditions.join(' AND ')}
      ORDER BY name_en ASC
    `;

    const result = await this.db.query(query, values);
    return result.rows.map((r) => new InventoryCatalog(r));
  }

  async findCatalogById(id: number, client?: PoolClient): Promise<InventoryCatalog | null> {
    const query = `SELECT * FROM inventory_catalog WHERE id = $1 AND deleted_at IS NULL`;
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
      RETURNING *
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
      RETURNING *
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
      SELECT a.*, 
             row_to_json(c.*) as item
      FROM inventory_assignments a
      JOIN inventory_catalog c ON a.catalog_id = c.id
      WHERE a.location_id = $1
    `;
    const result = await this.db.query(query, [locationId]);
    return result.rows.map((r) => {
      const assignment = new InventoryAssignment(r);
      if (r.item) assignment.item = new InventoryCatalog(r.item);
      return assignment;
    });
  }

  async findAssignmentsByBed(bedId: number): Promise<InventoryAssignment[]> {
    const query = `
      SELECT a.*, 
             row_to_json(c.*) as item
      FROM inventory_assignments a
      JOIN inventory_catalog c ON a.catalog_id = c.id
      WHERE a.bed_id = $1
    `;
    const result = await this.db.query(query, [bedId]);
    return result.rows.map((r) => {
      const assignment = new InventoryAssignment(r);
      if (r.item) assignment.item = new InventoryCatalog(r.item);
      return assignment;
    });
  }

  async updateAssignment(
    id: string,
    data: UpdateInventoryAssignmentDto,
    client?: PoolClient,
  ): Promise<InventoryAssignment | null> {
    const query = `
      UPDATE inventory_assignments
      SET quantity = $1, notes = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.getClient(client).query(query, [
      data.quantity,
      data.notes || null,
      id,
    ]);
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

  async findSnapshotsByBooking(bookingId: string): Promise<any[]> {
    const query = `SELECT * FROM booking_inventory_snapshots WHERE booking_id = $1 ORDER BY scope, name_en`;
    const result = await this.db.query(query, [bookingId]);
    return result.rows;
  }
}
