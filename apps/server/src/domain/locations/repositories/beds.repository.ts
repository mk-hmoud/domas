import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Bed } from '../entities/bed.entity';
import { IBedsRepository } from '../interfaces/beds-repository.interface';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

@Injectable()
export class BedsRepository implements IBedsRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  private get selectColumns(): string {
    return `
      id, 
      location_id as "locationId", 
      label, 
      status, 
      is_tr_only as "isTrOnly",
      is_guest_zone as "isGuestZone",
      ownership,
      updated_at as "updatedAt"
    `;
  }

  async create(data: Partial<Bed>, client?: PoolClient): Promise<Bed> {
    const query = `
      INSERT INTO beds (location_id, label, status, is_tr_only, is_guest_zone, ownership)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${this.selectColumns}
    `;
    const values = [
      data.locationId,
      data.label,
      data.status || BedStatus.AVAILABLE,
      data.isTrOnly || false,
      data.isGuestZone || false,
      data.ownership || LocationOwnership.DORM,
    ];
    const result = await this.getClient(client).query<Bed>(query, values);
    return new Bed(result.rows[0]);
  }

  async findAll(
    pagination: PaginationDto,
    filters?: { locationId?: number; status?: BedStatus },
    client?: PoolClient,
  ): Promise<PaginatedResult<Bed>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let query = `
      SELECT ${this.selectColumns}
      FROM beds
    `;
    const values: any[] = [];
    const conditions: string[] = ['deleted_at IS NULL'];

    if (filters?.locationId) {
      conditions.push(`location_id = $${values.length + 1}`);
      values.push(filters.locationId);
    }
    if (filters?.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY location_id ASC, label ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const countQuery = `SELECT COUNT(*) FROM beds ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}`;

    const dbClient = this.getClient(client);
    const [result, countResult] = await Promise.all([
      dbClient.query<Bed>(query, [...values, limit, offset]),
      dbClient.query<{ count: string }>(countQuery, values),
    ]);

    return {
      data: result.rows.map((row) => new Bed(row)),
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  async findById(id: number, client?: PoolClient): Promise<Bed | null> {
    const query = `
      SELECT ${this.selectColumns}
      FROM beds
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.getClient(client).query<Bed>(query, [id]);
    return result.rows[0] ? new Bed(result.rows[0]) : null;
  }

  async findByLocation(locationId: number, client?: PoolClient): Promise<Bed[]> {
    const query = `
      SELECT ${this.selectColumns}
      FROM beds
      WHERE location_id = $1 AND deleted_at IS NULL
      ORDER BY label ASC
    `;
    const result = await this.getClient(client).query<Bed>(query, [locationId]);
    return result.rows.map((row) => new Bed(row));
  }

  async findAvailableBeds(locationId: number, client?: PoolClient): Promise<Bed[]> {
    const query = `
      SELECT ${this.selectColumns}
      FROM beds
      WHERE location_id = $1 AND status = $2 AND deleted_at IS NULL
      ORDER BY label ASC
    `;
    const result = await this.getClient(client).query<Bed>(query, [
      locationId,
      BedStatus.AVAILABLE,
    ]);
    return result.rows.map((row) => new Bed(row));
  }

  async findByStatus(status: BedStatus, client?: PoolClient): Promise<Bed[]> {
    const query = `
      SELECT ${this.selectColumns}
      FROM beds
      WHERE status = $1 AND deleted_at IS NULL
    `;
    const result = await this.getClient(client).query<Bed>(query, [status]);
    return result.rows.map((row) => new Bed(row));
  }

  async update(id: number, data: Partial<Bed>, client?: PoolClient): Promise<Bed> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.locationId !== undefined) {
      updates.push(`location_id = $${paramIndex++}`);
      values.push(data.locationId);
    }
    if (data.label !== undefined) {
      updates.push(`label = $${paramIndex++}`);
      values.push(data.label);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    if (updates.length === 0) {
      const bed = await this.findById(id, client);
      if (!bed) throw new Error('Bed not found');
      return bed;
    }

    values.push(id);
    const query = `
      UPDATE beds
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING ${this.selectColumns}
    `;

    const result = await this.getClient(client).query<Bed>(query, values);
    return new Bed(result.rows[0]);
  }

  async updateStatus(id: number, status: BedStatus, client?: PoolClient): Promise<void> {
    const query = `UPDATE beds SET status = $1 WHERE id = $2 AND deleted_at IS NULL`;
    await this.getClient(client).query(query, [status, id]);
  }

  async delete(id: number, client?: PoolClient): Promise<void> {
    const query = `UPDATE beds SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`;
    await this.getClient(client).query(query, [id]);
  }

  async deleteMany(ids: number[], client?: PoolClient): Promise<void> {
    const query = `UPDATE beds SET deleted_at = NOW() WHERE id = ANY($1) AND deleted_at IS NULL`;
    await this.getClient(client).query(query, [ids]);
  }

  async countByLocation(locationId: number, client?: PoolClient): Promise<number> {
    const query = `SELECT COUNT(*) FROM beds WHERE location_id = $1 AND deleted_at IS NULL`;
    const result = await this.getClient(client).query<{ count: string }>(query, [locationId]);
    return parseInt(result.rows[0].count, 10);
  }

  async countAvailableByLocation(locationId: number, client?: PoolClient): Promise<number> {
    const query = `SELECT COUNT(*) FROM beds WHERE location_id = $1 AND status = $2 AND deleted_at IS NULL`;
    const result = await this.getClient(client).query<{ count: string }>(query, [
      locationId,
      BedStatus.AVAILABLE,
    ]);
    return parseInt(result.rows[0].count, 10);
  }

  async findEligibleBeds(filters: { gender: string; nationalityCode: string }): Promise<Bed[]> {
    const isTurkish = filters.nationalityCode === 'TR';

    const query = `
      SELECT 
        b.id, 
        b.location_id as "locationId", 
        b.label, 
        b.status, 
        b.is_tr_only as "isTrOnly",
        b.is_guest_zone as "isGuestZone",
        b.ownership,
        b.updated_at as "updatedAt",
        l.name as "locationName"
      FROM beds b
      JOIN locations l ON b.location_id = l.id
      WHERE b.status = 'available'
        AND b.deleted_at IS NULL
        AND l.deleted_at IS NULL
        -- Explicit Gender Lock Check on the Room
        AND (l.gender_lock IS NULL OR l.gender_lock = $1)
        -- Explicit TR Only Check on the Room or the Bed
        AND ((l.is_tr_only = FALSE AND b.is_tr_only = FALSE) OR $2 = TRUE)
      ORDER BY l.name ASC, b.label ASC
    `;

    const result = await this.db.query(query, [filters.gender, isTurkish]);
    return result.rows.map((row) => new Bed(row));
  }

  async updateTrOnly(id: number, isTrOnly: boolean, client?: PoolClient): Promise<Bed> {
    const query = `UPDATE beds SET is_tr_only = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING ${this.selectColumns}`;
    const result = await this.getClient(client).query<Bed>(query, [isTrOnly, id]);
    return new Bed(result.rows[0]);
  }

  async updateOwnership(id: number, ownership: any, client?: PoolClient): Promise<Bed> {
    const query = `UPDATE beds SET ownership = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING ${this.selectColumns}`;
    const result = await this.getClient(client).query<Bed>(query, [ownership, id]);
    return new Bed(result.rows[0]);
  }

  async updateGuestZone(id: number, isGuestZone: boolean, client?: PoolClient): Promise<Bed> {
    const query = `UPDATE beds SET is_guest_zone = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING ${this.selectColumns}`;
    const result = await this.getClient(client).query<Bed>(query, [isGuestZone, id]);
    return new Bed(result.rows[0]);
  }
}
