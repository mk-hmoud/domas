import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Bed } from '../entities/bed.entity';
import { IBedsRepository } from '../interfaces/beds-repository.interface';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class BedsRepository implements IBedsRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  async create(data: Partial<Bed>, client?: PoolClient): Promise<Bed> {
    const query = `
      INSERT INTO beds (location_id, label, status)
      VALUES ($1, $2, $3)
      RETURNING 
        id, 
        location_id as "locationId", 
        label, 
        status, 
        updated_at as "updatedAt"
    `;
    const values = [data.locationId, data.label, data.status || BedStatus.AVAILABLE];
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
      SELECT 
        id, 
        location_id as "locationId", 
        label, 
        status, 
        updated_at as "updatedAt"
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
      SELECT 
        id, 
        location_id as "locationId", 
        label, 
        status, 
        updated_at as "updatedAt"
      FROM beds
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.getClient(client).query<Bed>(query, [id]);
    return result.rows[0] ? new Bed(result.rows[0]) : null;
  }

  async findByLocation(locationId: number, client?: PoolClient): Promise<Bed[]> {
    const query = `
      SELECT 
        id, 
        location_id as "locationId", 
        label, 
        status, 
        updated_at as "updatedAt"
      FROM beds
      WHERE location_id = $1 AND deleted_at IS NULL
      ORDER BY label ASC
    `;
    const result = await this.getClient(client).query<Bed>(query, [locationId]);
    return result.rows.map((row) => new Bed(row));
  }

  async findAvailableBeds(locationId: number, client?: PoolClient): Promise<Bed[]> {
    const query = `
      SELECT 
        id, 
        location_id as "locationId", 
        label, 
        status, 
        updated_at as "updatedAt"
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
      SELECT 
        id, 
        location_id as "locationId", 
        label, 
        status, 
        updated_at as "updatedAt"
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
      RETURNING 
        id, 
        location_id as "locationId", 
        label, 
        status, 
        updated_at as "updatedAt"
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

  async countByLocation(locationId: number, client?: PoolClient): Promise<number> {
    const query = `SELECT COUNT(*) FROM beds WHERE location_id = $1`;
    const result = await this.getClient(client).query<{ count: string }>(query, [locationId]);
    return parseInt(result.rows[0].count, 10);
  }

  async countAvailableByLocation(locationId: number, client?: PoolClient): Promise<number> {
    const query = `SELECT COUNT(*) FROM beds WHERE location_id = $1 AND status = $2`;
    const result = await this.getClient(client).query<{ count: string }>(query, [
      locationId,
      BedStatus.AVAILABLE,
    ]);
    return parseInt(result.rows[0].count, 10);
  }
}
