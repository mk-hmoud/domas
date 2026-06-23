import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Location } from '../entities/location.entity';
import { ILocationsRepository } from '../interfaces/locations-repository.interface';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { FindAllLocationsDto } from '../dto/find-all-locations.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { LocationType } from '../../../common/enums/location-type.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { LocationScope } from '../../../common/interfaces/location-scope.interface';

@Injectable()
export class LocationsRepository implements ILocationsRepository {
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
      name,
      tree_path as "treePath",
      type,
      gender_lock as "genderLock",
      student_year_lock as "studentYearLock",
      is_guest_zone as "isGuestZone",
      is_tr_only as "isTrOnly",
      is_foreigner_only as "isForeignerOnly",
      ownership,
      room_type_id as "roomTypeId",
      created_at as "createdAt",
      updated_at as "updatedAt"
    `;
  }

  async create(data: Partial<Location>, client?: PoolClient): Promise<Location> {
    const query = `
      INSERT INTO locations (
        name, tree_path, type, gender_lock, student_year_lock, is_guest_zone, is_tr_only, is_foreigner_only, ownership, room_type_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING ${this.selectColumns}
    `;
    const values = [
      data.name,
      data.treePath,
      data.type,
      data.genderLock || null,
      data.studentYearLock || null,
      data.isGuestZone || false,
      data.isTrOnly || false,
      data.isForeignerOnly || false,
      data.ownership || LocationOwnership.DORM,
      data.roomTypeId || null,
    ];
    const result = await this.getClient(client).query<Location>(query, values);
    return new Location(result.rows[0]);
  }

  async findAll(
    filters: FindAllLocationsDto,
    client?: PoolClient,
    scope?: LocationScope,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      q,
      type,
      genderLock,
      isTrOnly,
      isForeignerOnly,
      isGuestZone,
      ownership,
      parentId,
      onlyVacant,
    } = filters;
    const offset = (page - 1) * limit;

    const dbClient = this.getClient(client);
    const params: any[] = [];
    const conditions: string[] = ['l.deleted_at IS NULL'];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`l.name ILIKE $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`l.type = $${params.length}`);
    }
    if (genderLock) {
      params.push(genderLock);
      conditions.push(`l.gender_lock = $${params.length}`);
    }
    if (isTrOnly !== undefined) {
      params.push(isTrOnly);
      conditions.push(`l.is_tr_only = $${params.length}`);
    }
    if (isForeignerOnly !== undefined) {
      params.push(isForeignerOnly);
      conditions.push(`l.is_foreigner_only = $${params.length}`);
    }
    if (isGuestZone !== undefined) {
      params.push(isGuestZone);
      conditions.push(`l.is_guest_zone = $${params.length}`);
    }
    if (ownership) {
      params.push(ownership);
      conditions.push(`l.ownership = $${params.length}`);
    }
    if (parentId) {
      const parent = await this.findById(parentId, client);
      if (parent) {
        params.push(parent.treePath);
        conditions.push(
          `l.tree_path <@ $${params.length} AND l.id != ${parentId} AND nlevel(l.tree_path) = nlevel($${params.length}) + 1`,
        );
      }
    }

    const scopeFilter = this.locationScopeService.buildScopeClause(
      scope,
      'l.tree_path',
      params.length + 1,
    );
    if (scopeFilter.param) params.push(scopeFilter.param);
    conditions.push(scopeFilter.clause);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Occupancy Subqueries
    const totalBedsSub = `(SELECT COUNT(*)::INT FROM beds b WHERE b.location_id IN (SELECT id FROM locations WHERE tree_path <@ l.tree_path) AND b.deleted_at IS NULL)`;
    const occupiedBedsSub = `(SELECT COUNT(*)::INT FROM beds b WHERE b.location_id IN (SELECT id FROM locations WHERE tree_path <@ l.tree_path) AND b.status = 'occupied' AND b.deleted_at IS NULL)`;
    const pathSub = `(SELECT string_agg(name, ' > ' ORDER BY tree_path) FROM locations WHERE tree_path @> l.tree_path AND id != l.id)`;

    let baseQuery = `
      SELECT
        l.id, l.name, l.tree_path as "treePath", l.type, l.gender_lock as "genderLock",
        l.student_year_lock as "studentYearLock",
        l.is_guest_zone as "isGuestZone", l.is_tr_only as "isTrOnly", l.is_foreigner_only as "isForeignerOnly", l.ownership,
        l.room_type_id as "roomTypeId", rt.name as "roomTypeName",
        l.created_at as "createdAt", l.updated_at as "updatedAt",
        ${totalBedsSub} as "totalBeds",
        ${occupiedBedsSub} as "occupiedBeds",
        ${pathSub} as "locationPath"
      FROM locations l
      LEFT JOIN room_types rt ON rt.id = l.room_type_id
      ${whereClause}
    `;

    if (onlyVacant) {
      baseQuery = `SELECT * FROM (${baseQuery}) sub WHERE "occupiedBeds" < "totalBeds"`;
    }

    const finalQuery = `${baseQuery} ORDER BY l.tree_path ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const countQuery = onlyVacant
      ? `SELECT COUNT(*)::INT FROM (${baseQuery}) sub`
      : `SELECT COUNT(*)::INT FROM locations l ${whereClause}`;

    const [result, countResult] = await Promise.all([
      dbClient.query(finalQuery, [...params, limit, offset]),
      dbClient.query<{ count: string | number }>(countQuery, params),
    ]);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count.toString(), 10),
      page,
      limit,
    };
  }

  async findById(id: number, client?: PoolClient): Promise<Location | null> {
    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.getClient(client).query<Location>(query, [id]);
    return result.rows[0] ? new Location(result.rows[0]) : null;
  }

  async findByTreePath(path: string, client?: PoolClient): Promise<Location | null> {
    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE tree_path = $1 AND deleted_at IS NULL
    `;
    const result = await this.getClient(client).query<Location>(query, [path]);
    return result.rows[0] ? new Location(result.rows[0]) : null;
  }

  async findByType(type: LocationType, client?: PoolClient): Promise<Location[]> {
    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE type = $1 AND deleted_at IS NULL
      ORDER BY tree_path ASC
    `;
    const result = await this.getClient(client).query<Location>(query, [type]);
    return result.rows.map((row) => new Location(row));
  }

  async findByParentPath(
    parentPath: string,
    type?: LocationType,
    client?: PoolClient,
  ): Promise<Location[]> {
    let query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE tree_path <@ $1 AND tree_path != $1 AND deleted_at IS NULL
    `;
    const params: any[] = [parentPath];

    if (type) {
      query += ` AND type = $2`;
      params.push(type);
    }

    query += ` ORDER BY tree_path ASC`;

    const result = await this.getClient(client).query<Location>(query, params);
    return result.rows.map((row) => new Location(row));
  }

  async findChildren(id: number, client?: PoolClient): Promise<Location[]> {
    const parent = await this.findById(id, client);
    if (!parent) return [];

    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE tree_path <@ $1 
        AND nlevel(tree_path) = nlevel($1) + 1
        AND deleted_at IS NULL
      ORDER BY tree_path ASC
     `;
    const result = await this.getClient(client).query<Location>(query, [parent.treePath]);
    return result.rows.map((row) => new Location(row));
  }

  // Flat bed-level rows for every room in the subtree under `locationId`.
  // The service groups these into nested room/bed/occupant shapes.
  async findRoomPlan(locationId: number, client?: PoolClient): Promise<any[]> {
    const parent = await this.findById(locationId, client);
    if (!parent) return [];

    const query = `
      SELECT
        l.id as "roomId",
        l.name as "roomName",
        l.gender_lock as "genderLock",
        l.student_year_lock as "studentYearLock",
        l.is_guest_zone as "isGuestZone",
        l.is_tr_only as "isTrOnly",
        l.is_foreigner_only as "isForeignerOnly",
        l.ownership,
        rt.id as "roomTypeId",
        rt.name as "roomTypeName",
        rt.capacity as "capacity",
        parent.id as "parentLocationId",
        parent.name as "parentLocationName",
        bd.id as "bedId",
        bd.label as "bedLabel",
        bd.status as "bedStatus",
        cur.booking_id as "currentBookingId",
        cur.student_id as "currentStudentId",
        cur.first_name as "currentFirstName",
        cur.last_name as "currentLastName",
        cur.student_number as "currentStudentNumber",
        cur.gender as "currentGender",
        cur.nationality_code as "currentNationalityCode",
        cur.email as "currentEmail",
        cur.phone_number as "currentPhoneNumber",
        cur.whatsapp_number as "currentWhatsappNumber",
        cur.payment_status as "currentPaymentStatus",
        cur.checked_in_at as "currentCheckedInAt",
        pend.booking_id as "pendingBookingId",
        pend.student_id as "pendingStudentId",
        pend.first_name as "pendingFirstName",
        pend.last_name as "pendingLastName",
        pend.student_number as "pendingStudentNumber",
        pend.start_date as "pendingStartDate",
        pend.status as "pendingStatus"
      FROM locations l
      JOIN room_types rt ON rt.id = l.room_type_id
      LEFT JOIN locations parent ON parent.tree_path = subpath(l.tree_path, 0, nlevel(l.tree_path) - 1)
      LEFT JOIN beds bd ON bd.location_id = l.id AND bd.deleted_at IS NULL
      LEFT JOIN LATERAL (
        SELECT b.id as booking_id, b.student_id, b.payment_status, b.checked_in_at,
               s.first_name, s.last_name, s.student_number, s.gender, s.nationality_code,
               s.email, s.phone_number, s.whatsapp_number
        FROM bookings b
        JOIN students s ON s.id = b.student_id
        WHERE b.bed_id = bd.id AND b.status = 'active'
        ORDER BY b.start_date DESC
        LIMIT 1
      ) cur ON true
      LEFT JOIN LATERAL (
        SELECT b.id as booking_id, b.student_id, b.start_date, b.status,
               s.first_name, s.last_name, s.student_number
        FROM bookings b
        JOIN students s ON s.id = b.student_id
        WHERE b.bed_id = bd.id
          AND b.status IN ('pending_accounting', 'ready_for_checkin', 'confirmed')
        ORDER BY b.start_date ASC
        LIMIT 1
      ) pend ON true
      WHERE l.type = 'room' AND l.deleted_at IS NULL AND l.tree_path <@ $1
      ORDER BY l.tree_path ASC, bd.label ASC
    `;
    const result = await this.getClient(client).query(query, [parent.treePath]);
    return result.rows;
  }

  async findWithAncestors(id: number, client?: PoolClient): Promise<Location[]> {
    const target = await this.findById(id, client);
    if (!target) return [];

    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE tree_path @> $1 AND deleted_at IS NULL
      ORDER BY tree_path ASC
      `;
    const result = await this.getClient(client).query<Location>(query, [target.treePath]);
    return result.rows.map((row) => new Location(row));
  }

  async update(id: number, data: Partial<Location>, client?: PoolClient): Promise<Location> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const addUpdate = (col: string, val: any) => {
      updates.push(`${col} = $${paramIndex++}`);
      values.push(val);
    };

    if (data.name !== undefined) addUpdate('name', data.name);
    if (data.treePath !== undefined) addUpdate('tree_path', data.treePath);
    if (data.type !== undefined) addUpdate('type', data.type);
    if (data.genderLock !== undefined) addUpdate('gender_lock', data.genderLock);
    if ('studentYearLock' in data) addUpdate('student_year_lock', data.studentYearLock ?? null);
    if (data.isGuestZone !== undefined) addUpdate('is_guest_zone', data.isGuestZone);
    if (data.isTrOnly !== undefined) addUpdate('is_tr_only', data.isTrOnly);
    if (data.isForeignerOnly !== undefined) addUpdate('is_foreigner_only', data.isForeignerOnly);
    if (data.ownership !== undefined) addUpdate('ownership', data.ownership);
    if ('roomTypeId' in data) addUpdate('room_type_id', data.roomTypeId ?? null);

    if (updates.length === 0) {
      const loc = await this.findById(id, client);
      if (!loc) throw new Error('Location not found');
      return loc;
    }

    values.push(id);
    const query = `
      UPDATE locations
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING ${this.selectColumns}
    `;

    const result = await this.getClient(client).query<Location>(query, values);
    return new Location(result.rows[0]);
  }

  async updateMany(ids: number[], data: Partial<Location>, client?: PoolClient): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.genderLock !== undefined) {
      updates.push(`gender_lock = $${paramIndex++}`);
      values.push(data.genderLock);
    }
    if (data.isGuestZone !== undefined) {
      updates.push(`is_guest_zone = $${paramIndex++}`);
      values.push(data.isGuestZone);
    }
    if (data.isTrOnly !== undefined) {
      updates.push(`is_tr_only = $${paramIndex++}`);
      values.push(data.isTrOnly);
    }
    if (data.isForeignerOnly !== undefined) {
      updates.push(`is_foreigner_only = $${paramIndex++}`);
      values.push(data.isForeignerOnly);
    }
    if (data.ownership !== undefined) {
      updates.push(`ownership = $${paramIndex++}`);
      values.push(data.ownership);
    }

    if (updates.length === 0) return;

    values.push(ids);
    const query = `
      UPDATE locations
      SET ${updates.join(', ')}
      WHERE id = ANY($${paramIndex}) AND deleted_at IS NULL
    `;

    await this.getClient(client).query(query, values);
  }

  // Cascades to the whole subtree (tree_path containment includes the node itself).
  async delete(id: number, client?: PoolClient): Promise<void> {
    const query = `
      UPDATE locations
      SET deleted_at = NOW()
      WHERE deleted_at IS NULL
        AND tree_path <@ (SELECT tree_path FROM locations WHERE id = $1)
    `;
    await this.getClient(client).query(query, [id]);
  }

  // Cascades to the subtree under each id - safe to call with overlapping
  // subtrees (e.g. a node and one of its own descendants both selected).
  async deleteMany(ids: number[], client?: PoolClient): Promise<void> {
    const query = `
      WITH target_paths AS (
        SELECT tree_path FROM locations WHERE id = ANY($1)
      )
      UPDATE locations l
      SET deleted_at = NOW()
      FROM target_paths tp
      WHERE l.tree_path <@ tp.tree_path AND l.deleted_at IS NULL
    `;
    await this.getClient(client).query(query, [ids]);
  }

  async exists(id: number, client?: PoolClient): Promise<boolean> {
    const query = `SELECT 1 FROM locations WHERE id = $1 AND deleted_at IS NULL`;
    const result = await this.getClient(client).query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async countByType(type: LocationType, client?: PoolClient): Promise<number> {
    const query = `SELECT COUNT(*) FROM locations WHERE type = $1 AND deleted_at IS NULL`;
    const result = await this.getClient(client).query<{ count: string }>(query, [type]);
    return parseInt(result.rows[0].count, 10);
  }

  async searchByName(
    queryStr: string,
    options: { includePath?: boolean } = {},
    client?: PoolClient,
  ): Promise<Location[]> {
    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE name ILIKE $1 AND deleted_at IS NULL
      ORDER BY tree_path ASC
      LIMIT 20
    `;
    const result = await this.getClient(client).query<Location>(query, [`%${queryStr}%`]);
    const locations = result.rows.map((row) => new Location(row));

    if (options.includePath && locations.length > 0) {
      for (const loc of locations) {
        loc.locationPath = await this.getPathDisplayName(loc.treePath, client);
      }
    }

    return locations;
  }

  async getPathDisplayName(path: string, client?: PoolClient): Promise<string> {
    const query = `
      SELECT string_agg(name, ' > ' ORDER BY tree_path) as path
      FROM locations
      WHERE tree_path @> $1 AND deleted_at IS NULL
    `;
    const result = await this.getClient(client).query(query, [path]);
    return result.rows[0]?.path || '';
  }

  async updateGenderLock(
    id: number,
    genderLock: any,
    cascade: boolean,
    client?: PoolClient,
  ): Promise<Location> {
    const target = await this.findById(id, client);
    if (!target) throw new Error('Location not found');

    let query = '';
    let params: any[] = [];

    if (cascade) {
      query = `UPDATE locations SET gender_lock = $1 WHERE tree_path <@ $2 AND deleted_at IS NULL`;
      params = [genderLock, target.treePath];
    } else {
      query = `UPDATE locations SET gender_lock = $1 WHERE id = $2 AND deleted_at IS NULL`;
      params = [genderLock, id];
    }

    await this.getClient(client).query(query, params);
    target.genderLock = genderLock;
    return target;
  }

  async updateStudentYearLock(
    id: number,
    studentYearLock: string | null,
    cascade: boolean,
    client?: PoolClient,
  ): Promise<Location> {
    const target = await this.findById(id, client);
    if (!target) throw new Error('Location not found');

    let query = '';
    let params: any[] = [];

    if (cascade) {
      query = `UPDATE locations SET student_year_lock = $1 WHERE tree_path <@ $2 AND deleted_at IS NULL`;
      params = [studentYearLock, target.treePath];
    } else {
      query = `UPDATE locations SET student_year_lock = $1 WHERE id = $2 AND deleted_at IS NULL`;
      params = [studentYearLock, id];
    }

    await this.getClient(client).query(query, params);
    target.studentYearLock = studentYearLock as any;
    return target;
  }

  async updateGuestZone(
    id: number,
    isGuestZone: boolean,
    cascade: boolean,
    client?: PoolClient,
  ): Promise<Location> {
    const target = await this.findById(id, client);
    if (!target) throw new Error('Location not found');

    const dbClient = this.getClient(client);

    if (cascade) {
      // Update locations
      await dbClient.query(
        `UPDATE locations SET is_guest_zone = $1 WHERE tree_path <@ $2 AND deleted_at IS NULL`,
        [isGuestZone, target.treePath],
      );
      // Update all beds in those locations
      await dbClient.query(
        `
        UPDATE beds SET is_guest_zone = $1 
        WHERE location_id IN (SELECT id FROM locations WHERE tree_path <@ $2)
          AND deleted_at IS NULL
      `,
        [isGuestZone, target.treePath],
      );
    } else {
      await dbClient.query(
        `UPDATE locations SET is_guest_zone = $1 WHERE id = $2 AND deleted_at IS NULL`,
        [isGuestZone, id],
      );
      // Update beds in this specific location only
      await dbClient.query(
        `UPDATE beds SET is_guest_zone = $1 WHERE location_id = $2 AND deleted_at IS NULL`,
        [isGuestZone, id],
      );
    }

    target.isGuestZone = isGuestZone;
    return target;
  }

  async updateTrOnly(
    id: number,
    isTrOnly: boolean,
    cascade: boolean,
    client?: PoolClient,
  ): Promise<Location> {
    const target = await this.findById(id, client);
    if (!target) throw new Error('Location not found');

    const dbClient = this.getClient(client);

    if (cascade) {
      await dbClient.query(
        `UPDATE locations SET is_tr_only = $1 WHERE tree_path <@ $2 AND deleted_at IS NULL`,
        [isTrOnly, target.treePath],
      );
      await dbClient.query(
        `
        UPDATE beds SET is_tr_only = $1 
        WHERE location_id IN (SELECT id FROM locations WHERE tree_path <@ $2)
          AND deleted_at IS NULL
      `,
        [isTrOnly, target.treePath],
      );
    } else {
      await dbClient.query(
        `UPDATE locations SET is_tr_only = $1 WHERE id = $2 AND deleted_at IS NULL`,
        [isTrOnly, id],
      );
      await dbClient.query(
        `UPDATE beds SET is_tr_only = $1 WHERE location_id = $2 AND deleted_at IS NULL`,
        [isTrOnly, id],
      );
    }

    target.isTrOnly = isTrOnly;
    return target;
  }

  async updateForeignerOnly(
    id: number,
    isForeignerOnly: boolean,
    cascade: boolean,
    client?: PoolClient,
  ): Promise<Location> {
    const target = await this.findById(id, client);
    if (!target) throw new Error('Location not found');

    const dbClient = this.getClient(client);

    if (cascade) {
      await dbClient.query(
        `UPDATE locations SET is_foreigner_only = $1 WHERE tree_path <@ $2 AND deleted_at IS NULL`,
        [isForeignerOnly, target.treePath],
      );
      await dbClient.query(
        `
        UPDATE beds SET is_foreigner_only = $1 
        WHERE location_id IN (SELECT id FROM locations WHERE tree_path <@ $2)
          AND deleted_at IS NULL
      `,
        [isForeignerOnly, target.treePath],
      );
    } else {
      await dbClient.query(
        `UPDATE locations SET is_foreigner_only = $1 WHERE id = $2 AND deleted_at IS NULL`,
        [isForeignerOnly, id],
      );
      await dbClient.query(
        `UPDATE beds SET is_foreigner_only = $1 WHERE location_id = $2 AND deleted_at IS NULL`,
        [isForeignerOnly, id],
      );
    }

    target.isForeignerOnly = isForeignerOnly;
    return target;
  }

  async updateOwnership(
    id: number,
    ownership: any,
    cascade: boolean,
    client?: PoolClient,
  ): Promise<Location> {
    const target = await this.findById(id, client);
    if (!target) throw new Error('Location not found');

    const dbClient = this.getClient(client);

    if (cascade) {
      await dbClient.query(
        `UPDATE locations SET ownership = $1 WHERE tree_path <@ $2 AND deleted_at IS NULL`,
        [ownership, target.treePath],
      );
      await dbClient.query(
        `
        UPDATE beds SET ownership = $1 
        WHERE location_id IN (SELECT id FROM locations WHERE tree_path <@ $2)
          AND deleted_at IS NULL
      `,
        [ownership, target.treePath],
      );
    } else {
      await dbClient.query(
        `UPDATE locations SET ownership = $1 WHERE id = $2 AND deleted_at IS NULL`,
        [ownership, id],
      );
      await dbClient.query(
        `UPDATE beds SET ownership = $1 WHERE location_id = $2 AND deleted_at IS NULL`,
        [ownership, id],
      );
    }

    target.ownership = ownership;
    return target;
  }

  async clearGenderLockIfEmpty(locationId: number, client?: PoolClient): Promise<void> {
    const query = `
      UPDATE locations
      SET gender_lock = NULL, updated_at = NOW()
      WHERE id = $1
        AND NOT EXISTS (
          -- Check for physical occupancy
          SELECT 1 FROM beds b
          WHERE b.location_id = locations.id 
            AND b.status = 'occupied'
            AND b.deleted_at IS NULL
        )
        AND NOT EXISTS (
          -- Check for logical reservations (upcoming or active bookings)
          SELECT 1 FROM bookings bo
          JOIN beds b2 ON bo.bed_id = b2.id
          WHERE b2.location_id = locations.id
            AND bo.status NOT IN ('cancelled', 'rejected', 'completed')
        )
    `;
    await this.getClient(client).query(query, [locationId]);
  }

  async lockGenderIfNull(locationId: number, gender: string, client?: PoolClient): Promise<void> {
    const query = `
      UPDATE locations
      SET gender_lock = $1, updated_at = NOW()
      WHERE id = $2 AND gender_lock IS NULL
    `;
    await this.getClient(client).query(query, [gender, locationId]);
  }
}
