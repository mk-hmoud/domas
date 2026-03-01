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

  private get selectColumns(): string {
    return `
      id, 
      type, 
      academic_year as "academicYear", 
      display_name as "displayName",
      start_date as "startDate", 
      end_date as "endDate",
      booking_start_date as "bookingStartDate",
      booking_end_date as "bookingEndDate",
      deposit_amount_try::numeric as "depositAmountTry",
      deposit_amount_foreign::numeric as "depositAmountForeign",
      foreign_currency_code as "foreignCurrencyCode",
      payment_deadline_date as "paymentDeadlineDate",
      status,
      created_at as "createdAt", 
      updated_at as "updatedAt",
      created_by as "createdBy"
    `;
  }

  private generateDisplayName(academicYear: string, type: string): string {
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    return `${academicYear} ${capitalizedType}`;
  }

  async create(data: CreateSemesterDto, client?: PoolClient): Promise<Semester> {
    const displayName = this.generateDisplayName(data.academicYear, data.type);

    const query = `
      INSERT INTO semesters (
        type, academic_year, display_name, start_date, end_date, booking_start_date, booking_end_date,
        deposit_amount_try, deposit_amount_foreign, foreign_currency_code, payment_deadline_date,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING ${this.selectColumns}
    `;
    const values = [
      data.type,
      data.academicYear,
      displayName,
      data.startDate,
      data.endDate,
      data.bookingStartDate || null,
      data.bookingEndDate || null,
      data.depositAmountTry || 0,
      data.depositAmountForeign || 0,
      data.foreignCurrencyCode || 'EUR',
      data.paymentDeadlineDate || null,
      data.status,
    ];
    const result = await this.getClient(client).query<Semester>(query, values);
    return new Semester(result.rows[0]);
  }

  async findAll(
    pagination: PaginationDto,
    client?: PoolClient,
  ): Promise<PaginatedResult<Semester>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const query = `
      SELECT ${this.selectColumns}
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
      SELECT ${this.selectColumns}
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

    // Helper to add update fields
    const addUpdate = (col: string, val: any) => {
      updates.push(`${col} = $${paramIndex++}`);
      values.push(val);
    };

    if (data.type) addUpdate('type', data.type);
    if (data.academicYear) addUpdate('academic_year', data.academicYear);

    // Handle Display Name Update
    if (data.type || data.academicYear) {
      const current = await this.findById(id, client);
      if (current) {
        const newYear = data.academicYear || current.academicYear;
        const newType = data.type || current.type;
        const newDisplayName = this.generateDisplayName(newYear, newType);
        addUpdate('display_name', newDisplayName);
      }
    }

    if (data.startDate) addUpdate('start_date', data.startDate);
    if (data.endDate) addUpdate('end_date', data.endDate);
    if (data.bookingStartDate !== undefined) addUpdate('booking_start_date', data.bookingStartDate);
    if (data.bookingEndDate !== undefined) addUpdate('booking_end_date', data.bookingEndDate);
    if (data.depositAmountTry !== undefined) addUpdate('deposit_amount_try', data.depositAmountTry);
    if (data.depositAmountForeign !== undefined)
      addUpdate('deposit_amount_foreign', data.depositAmountForeign);
    if (data.foreignCurrencyCode) addUpdate('foreign_currency_code', data.foreignCurrencyCode);
    if (data.paymentDeadlineDate !== undefined)
      addUpdate('payment_deadline_date', data.paymentDeadlineDate);
    if (data.status) addUpdate('status', data.status);

    if (updates.length === 0) {
      return this.findById(id, client);
    }

    values.push(id);
    const query = `
      UPDATE semesters
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING ${this.selectColumns}
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
    // Legacy support: "deactivate" now means setting status away from ACTIVE?
    // Or we strictly enforce only ONE active semester via DB Constraint.
    // If the service logic tries to set one to Active, we might need to "Close" the others?
    // For now, let's assume specific logic in Service.
    // But this method was generic "turn off all".
    const query = `UPDATE semesters SET status = 'closed' WHERE status = 'active'`;
    await this.getClient(client).query(query);
  }

  async findPendingAutoTransitions(client?: PoolClient): Promise<Semester[]> {
    const query = `
      SELECT ${this.selectColumns}
      FROM semesters
      WHERE status = 'open' AND start_date <= CURRENT_DATE
    `;
    const result = await this.getClient(client).query<Semester>(query);
    return result.rows.map((r) => new Semester(r));
  }
}
