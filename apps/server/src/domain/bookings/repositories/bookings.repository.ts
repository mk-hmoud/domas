import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Booking } from '../entities/booking.entity';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

@Injectable()
export class BookingsRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  private mapRowToEntity(row: any): Booking {
    return new Booking({
      id: row.id,
      studentId: row.student_id,
      bedId: row.bed_id,
      semesterId: row.semester_id,
      previousBookingId: row.previous_booking_id,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      paymentStatus: row.payment_status,
      isAccountingApproved: row.is_accounting_approved,
      accountingApprovedAt: row.accounting_approved_at,
      accountingApprovedBy: row.accounting_approved_by,
      checkedInAt: row.checked_in_at,
      checkedOutAt: row.checked_out_at,
      contractSigned: row.contract_signed,
      contractUrl: row.contract_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async create(data: Partial<Booking>, client?: PoolClient): Promise<Booking> {
    const query = `
      INSERT INTO bookings (
        student_id, bed_id, semester_id, previous_booking_id, start_date, end_date, status, payment_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      data.studentId,
      data.bedId,
      data.semesterId,
      data.previousBookingId || null,
      data.startDate,
      data.endDate,
      data.status || BookingOpsStatus.PENDING_ACCOUNTING,
      data.paymentStatus || PaymentStatus.PENDING,
    ];

    const result = await this.getClient(client).query(query, values);
    return this.mapRowToEntity(result.rows[0]);
  }

  async findById(id: string, client?: PoolClient): Promise<Booking | null> {
    const query = `SELECT * FROM bookings WHERE id = $1`;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async update(id: string, data: UpdateBookingDto, client?: PoolClient): Promise<Booking | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert camelCase to snake_case for DB columns
        const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        updates.push(`${dbKey} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) return this.findById(id, client);

    values.push(id);
    const query = `
      UPDATE bookings 
      SET ${updates.join(', ')}, updated_at = NOW() 
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    const result = await this.getClient(client).query(query, values);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async approveFinancials(
    id: string,
    approvedBy: string,
    paymentStatus?: PaymentStatus,
    client?: PoolClient,
  ): Promise<Booking | null> {
    const query = `
      UPDATE bookings
      SET 
        is_accounting_approved = TRUE,
        accounting_approved_at = NOW(),
        accounting_approved_by = $2,
        status = 'ready_for_checkin',
        payment_status = COALESCE($3, payment_status),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.getClient(client).query(query, [id, approvedBy, paymentStatus]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async checkIn(id: string, client?: PoolClient): Promise<Booking | null> {
    const query = `
      UPDATE bookings
      SET 
        status = 'active',
        checked_in_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async checkOut(id: string, client?: PoolClient): Promise<Booking | null> {
    const query = `
      UPDATE bookings
      SET 
        status = 'completed',
        checked_out_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async findAll(
    filters: { studentId?: string; status?: BookingOpsStatus },
    client?: PoolClient,
  ): Promise<Booking[]> {
    let query = `SELECT * FROM bookings`;
    const values: any[] = [];
    const conditions: string[] = [];

    if (filters.studentId) {
      conditions.push(`student_id = $${values.length + 1}`);
      values.push(filters.studentId);
    }
    if (filters.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC`;
    const result = await this.getClient(client).query(query, values);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  async countBySemester(semesterId: number, client?: PoolClient): Promise<number> {
    const query = `SELECT COUNT(*) FROM bookings WHERE semester_id = $1`;
    const result = await this.getClient(client).query<{ count: string }>(query, [semesterId]);
    return parseInt(result.rows[0].count, 10);
  }

  async countActiveByRoom(locationId: number, client?: PoolClient): Promise<number> {
    const query = `
      SELECT COUNT(*) 
      FROM bookings b
      JOIN beds bd ON b.bed_id = bd.id
      WHERE bd.location_id = $1 
        AND b.status NOT IN ('cancelled', 'rejected', 'completed')
    `;
    const result = await this.getClient(client).query<{ count: string }>(query, [locationId]);
    return parseInt(result.rows[0].count, 10);
  }
}
