import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Semester } from '../entities/semester.entity';
import { CreateSemesterDto } from '../dto/create-semester.dto';
import { UpdateSemesterDto } from '../dto/update-semester.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class SemestersRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  async create(data: CreateSemesterDto, client?: PoolClient): Promise<Semester> {
    const query = `
      INSERT INTO semesters (name, start_date, end_date, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, 
        name, 
        start_date as "startDate", 
        end_date as "endDate", 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;
    const result = await this.getClient(client).query<Semester>(query, [
      data.name,
      data.startDate,
      data.endDate,
      data.isActive || false,
    ]);
    return new Semester(result.rows[0]);
  }

  async findAll(
    pagination: PaginationDto,
    client?: PoolClient,
  ): Promise<PaginatedResult<Semester>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        id, 
        name, 
        start_date as "startDate", 
        end_date as "endDate", 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM semesters
      ORDER BY start_date DESC
      LIMIT $1 OFFSET $2
    `;
    const countQuery = `SELECT COUNT(*) FROM semesters`;

    const dbClient = this.getClient(client);
    const [result, countResult] = await Promise.all([
      dbClient.query<Semester>(query, [limit, offset]),
      dbClient.query<{ count: string }>(countQuery),
    ]);

    return {
      data: result.rows.map((row) => new Semester(row)),
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  async findById(id: number, client?: PoolClient): Promise<Semester | null> {
    const query = `
      SELECT 
        id, 
        name, 
        start_date as "startDate", 
        end_date as "endDate", 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM semesters
      WHERE id = $1
    `;
    const result = await this.getClient(client).query<Semester>(query, [id]);
    return result.rows[0] ? new Semester(result.rows[0]) : null;
  }

  async update(id: number, data: UpdateSemesterDto, client?: PoolClient): Promise<Semester | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(data.endDate);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    if (updates.length === 0) {
      return this.findById(id, client);
    }

    values.push(id);
    const query = `
      UPDATE semesters
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, 
        name, 
        start_date as "startDate", 
        end_date as "endDate", 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;

    const result = await this.getClient(client).query<Semester>(query, values);
    return result.rows[0] ? new Semester(result.rows[0]) : null;
  }

  async delete(id: number, client?: PoolClient): Promise<boolean> {
    const query = `DELETE FROM semesters WHERE id = $1`;
    const result = await this.getClient(client).query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async deactivateAll(client?: PoolClient): Promise<void> {
    const query = `UPDATE semesters SET is_active = FALSE WHERE is_active = TRUE`;
    await this.getClient(client).query(query);
  }
}
