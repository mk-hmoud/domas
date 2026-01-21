import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Location } from '../entities/location.entity';
import { ILocationsRepository } from '../interfaces/locations-repository.interface';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { LocationType } from '../../../common/enums/location-type.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

@Injectable()
export class LocationsRepository implements ILocationsRepository {
  constructor(private readonly db: DatabaseService) {}

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
      is_guest_zone as "isGuestZone", 
      is_tr_only as "isTrOnly",
      ownership,
      capacity, 
      base_price as "basePrice", 
      created_at as "createdAt", 
      updated_at as "updatedAt"
    `;
  }

  async create(data: Partial<Location>, client?: PoolClient): Promise<Location> {
    const query = `
      INSERT INTO locations (
        name, tree_path, type, gender_lock, is_guest_zone, is_tr_only, ownership, capacity, base_price
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING ${this.selectColumns}
    `;
    const values = [
      data.name,
      data.treePath,
      data.type,
      data.genderLock || null,
      data.isGuestZone || false,
      data.isTrOnly || false,
      data.ownership || LocationOwnership.DORM,
      data.capacity || 0,
      data.basePrice || null,
    ];
    const result = await this.getClient(client).query<Location>(query, values);
    return new Location(result.rows[0]);
  }

  async findAll(
    pagination: PaginationDto,
    client?: PoolClient,
  ): Promise<PaginatedResult<Location>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      ORDER BY tree_path ASC
      LIMIT $1 OFFSET $2
    `;
    const countQuery = `SELECT COUNT(*) FROM locations`;

    const dbClient = this.getClient(client);
    const [result, countResult] = await Promise.all([
      dbClient.query<Location>(query, [limit, offset]),
      dbClient.query<{ count: string }>(countQuery),
    ]);

    return {
      data: result.rows.map((row) => new Location(row)),
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  async findById(id: number, client?: PoolClient): Promise<Location | null> {
    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE id = $1
    `;
    const result = await this.getClient(client).query<Location>(query, [id]);
    return result.rows[0] ? new Location(result.rows[0]) : null;
  }

  async findByTreePath(path: string, client?: PoolClient): Promise<Location | null> {
    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE tree_path = $1
    `;
    const result = await this.getClient(client).query<Location>(query, [path]);
    return result.rows[0] ? new Location(result.rows[0]) : null;
  }

  async findByType(type: LocationType, client?: PoolClient): Promise<Location[]> {
    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE type = $1
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
      WHERE tree_path <@ $1 AND tree_path != $1
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
      ORDER BY tree_path ASC
     `;
    const result = await this.getClient(client).query<Location>(query, [parent.treePath]);
    return result.rows.map((row) => new Location(row));
  }

  async findWithAncestors(id: number, client?: PoolClient): Promise<Location[]> {
    const target = await this.findById(id, client);
    if (!target) return [];

    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE tree_path @> $1
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
    if (data.type !== undefined) addUpdate('type', data.type);
    if (data.genderLock !== undefined) addUpdate('gender_lock', data.genderLock);
    if (data.isGuestZone !== undefined) addUpdate('is_guest_zone', data.isGuestZone);
    if (data.isTrOnly !== undefined) addUpdate('is_tr_only', data.isTrOnly);
    if (data.ownership !== undefined) addUpdate('ownership', data.ownership);
    if (data.capacity !== undefined) addUpdate('capacity', data.capacity);
    if (data.basePrice !== undefined) addUpdate('base_price', data.basePrice);

    if (updates.length === 0) {
      const loc = await this.findById(id, client);
      if (!loc) throw new Error('Location not found');
      return loc;
    }

    values.push(id);
    const query = `
      UPDATE locations
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING ${this.selectColumns}
    `;

    const result = await this.getClient(client).query<Location>(query, values);
    return new Location(result.rows[0]);
  }

  async delete(id: number, client?: PoolClient): Promise<void> {
    const query = `DELETE FROM locations WHERE id = $1`;
    await this.getClient(client).query(query, [id]);
  }

  async exists(id: number, client?: PoolClient): Promise<boolean> {
    const query = `SELECT 1 FROM locations WHERE id = $1`;
    const result = await this.getClient(client).query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async countByType(type: LocationType, client?: PoolClient): Promise<number> {
    const query = `SELECT COUNT(*) FROM locations WHERE type = $1`;
    const result = await this.getClient(client).query<{ count: string }>(query, [type]);
    return parseInt(result.rows[0].count, 10);
  }

  async searchByName(queryStr: string, client?: PoolClient): Promise<Location[]> {
    const query = `
      SELECT ${this.selectColumns}
      FROM locations
      WHERE name ILIKE $1
      ORDER BY tree_path ASC
      LIMIT 20
    `;
    const result = await this.getClient(client).query<Location>(query, [`%${queryStr}%`]);
    return result.rows.map((row) => new Location(row));
  }
}
