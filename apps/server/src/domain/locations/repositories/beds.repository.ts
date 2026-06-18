import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Bed } from '../entities/bed.entity';
import { IBedsRepository } from '../interfaces/beds-repository.interface';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { FindAllBedsDto } from '../dto/find-all-beds.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';
import { isTurkishNational } from '../../../common/utils/nationality.utils';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { LocationScope } from '../../../common/interfaces/location-scope.interface';

@Injectable()
export class BedsRepository implements IBedsRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly locationScopeService: LocationScopeService,
  ) {}

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
      is_foreigner_only as "isForeignerOnly",
      is_guest_zone as "isGuestZone",
      ownership,
      updated_at as "updatedAt"
    `;
  }

  async create(data: Partial<Bed>, client?: PoolClient): Promise<Bed> {
    const query = `
      INSERT INTO beds (location_id, label, status, is_tr_only, is_foreigner_only, is_guest_zone, ownership)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${this.selectColumns}
    `;
    const values = [
      data.locationId,
      data.label,
      data.status || BedStatus.AVAILABLE,
      data.isTrOnly || false,
      data.isForeignerOnly || false,
      data.isGuestZone || false,
      data.ownership || LocationOwnership.DORM,
    ];
    const result = await this.getClient(client).query<Bed>(query, values);
    return new Bed(result.rows[0]);
  }

  async findAll(
    filters: FindAllBedsDto,
    client?: PoolClient,
    scope?: LocationScope,
  ): Promise<PaginatedResult<Bed>> {
    const {
      page = 1,
      limit = 10,
      locationId,
      status,
      genderLock,
      isTrOnly,
      isForeignerOnly,
      isGuestZone,
      ownership,
      q,
    } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        b.id, 
        b.location_id as "locationId", 
        b.label, 
        b.status, 
        b.is_tr_only as "isTrOnly", 
        b.is_foreigner_only as "isForeignerOnly",
        b.is_guest_zone as "isGuestZone", 
        b.ownership, 
        b.updated_at as "updatedAt",
        'bed' as "type",
        l.name as "locationName",
        (SELECT string_agg(name, ' > ' ORDER BY tree_path) FROM locations WHERE tree_path @> l.tree_path) as "locationPath",
        (SELECT s.first_name || ' ' || s.last_name 
         FROM bookings bo 
         JOIN students s ON bo.student_id = s.id 
         WHERE bo.bed_id = b.id AND bo.status IN ('active', 'ready_for_checkin')
         LIMIT 1) as "residentName"
      FROM beds b
      JOIN locations l ON b.location_id = l.id
    `;
    const values: any[] = [];
    const conditions: string[] = ['b.deleted_at IS NULL'];

    if (locationId) {
      conditions.push(`b.location_id = $${values.length + 1}`);
      values.push(locationId);
    }
    if (status) {
      conditions.push(`b.status = $${values.length + 1}`);
      values.push(status);
    }
    if (genderLock) {
      conditions.push(`l.gender_lock = $${values.length + 1}`);
      values.push(genderLock);
    }
    if (isTrOnly !== undefined) {
      conditions.push(`b.is_tr_only = $${values.length + 1}`);
      values.push(isTrOnly);
    }
    if (isForeignerOnly !== undefined) {
      conditions.push(`b.is_foreigner_only = $${values.length + 1}`);
      values.push(isForeignerOnly);
    }
    if (isGuestZone !== undefined) {
      conditions.push(`b.is_guest_zone = $${values.length + 1}`);
      values.push(isGuestZone);
    }
    if (ownership) {
      conditions.push(`b.ownership = $${values.length + 1}`);
      values.push(ownership);
    }
    if (q) {
      values.push(`%${q}%`);
      const pIdx = values.length;
      conditions.push(
        `(b.label ILIKE $${pIdx} OR EXISTS (
          SELECT 1 FROM locations l2 
          WHERE l2.tree_path @> l.tree_path 
          AND l2.name ILIKE $${pIdx}
          AND l2.deleted_at IS NULL
        ))`,
      );
    }

    const scopeFilter = this.locationScopeService.buildScopeClause(
      scope,
      'l.tree_path',
      values.length + 1,
    );
    if (scopeFilter.param) values.push(scopeFilter.param);
    conditions.push(scopeFilter.clause);

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY l.name ASC, b.label ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const countQuery = `
      SELECT COUNT(*) FROM beds b 
      JOIN locations l ON b.location_id = l.id
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
    `;

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
    if (data.isTrOnly !== undefined) {
      updates.push(`is_tr_only = $${paramIndex++}`);
      values.push(data.isTrOnly);
    }
    if (data.isForeignerOnly !== undefined) {
      updates.push(`is_foreigner_only = $${paramIndex++}`);
      values.push(data.isForeignerOnly);
    }
    if (data.isGuestZone !== undefined) {
      updates.push(`is_guest_zone = $${paramIndex++}`);
      values.push(data.isGuestZone);
    }
    if (data.ownership !== undefined) {
      updates.push(`ownership = $${paramIndex++}`);
      values.push(data.ownership);
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
    const isTurkish = isTurkishNational(filters.nationalityCode);

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
        -- Explicit Foreigner Only Check on the Room or the Bed (isTurkish is $2)
        AND ((l.is_foreigner_only = FALSE AND b.is_foreigner_only = FALSE) OR $2 = FALSE)
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

  async updateForeignerOnly(
    id: number,
    isForeignerOnly: boolean,
    client?: PoolClient,
  ): Promise<Bed> {
    const query = `UPDATE beds SET is_foreigner_only = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING ${this.selectColumns}`;
    const result = await this.getClient(client).query<Bed>(query, [isForeignerOnly, id]);
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
