import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { GuestStay } from '../entities/guest-stay.entity';
import { CreateGuestStayDto } from '../dto/create-guest-stay.dto';
import { UpdateGuestStayDto } from '../dto/update-guest-stay.dto';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { LocationScope } from '../../../common/interfaces/location-scope.interface';

@Injectable()
export class GuestStaysRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly locationScopeService: LocationScopeService,
  ) {}

  private getClient(client?: PoolClient) {
    return client || this.db.getPool();
  }

  private readonly baseSelect = `
    SELECT
      gs.*,
      g.first_name         AS guest_first_name,
      g.last_name          AS guest_last_name,
      g.id_number          AS guest_id_number,
      g.email              AS guest_email,
      g.phone              AS guest_phone,
      b.label              AS bed_label,
      r.name               AS room_name,
      r.tree_path::text    AS room_tree_path,
      l.tree_path::text    AS location_path,
      u.first_name || ' ' || u.last_name AS created_by_name
    FROM guest_stays gs
    JOIN guests g  ON g.id  = gs.guest_id
    JOIN beds b    ON b.id  = gs.bed_id
    JOIN locations r ON r.id = b.location_id
    JOIN locations l ON l.tree_path @> r.tree_path AND l.type = 'building'
    JOIN users u   ON u.id  = gs.created_by
  `;

  private map(row: any): GuestStay & {
    guest: any;
    bedLabel: string;
    roomName: string;
    locationPath: string;
    createdByName: string;
  } {
    return {
      id: row.id,
      guestId: row.guest_id,
      guest: {
        id: row.guest_id,
        firstName: row.guest_first_name,
        lastName: row.guest_last_name,
        idNumber: row.guest_id_number,
        email: row.guest_email,
        phone: row.guest_phone,
      },
      bedId: row.bed_id,
      bedLabel: row.bed_label,
      roomName: row.room_name,
      treePath: row.room_tree_path,
      locationPath: row.location_path ?? row.room_name,
      checkInDate: row.check_in_date,
      checkOutDate: row.check_out_date,
      actualCheckIn: row.actual_check_in,
      actualCheckOut: row.actual_check_out,
      status: row.status,
      paymentRequired: row.payment_required,
      amountDue: row.amount_due != null ? Number(row.amount_due) : undefined,
      amountPaid: Number(row.amount_paid ?? 0),
      currency: row.currency,
      paymentNotes: row.payment_notes,
      notes: row.notes,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as any;
  }

  async create(data: CreateGuestStayDto, userId: string, client?: PoolClient): Promise<any> {
    const result = await this.getClient(client).query(
      `INSERT INTO guest_stays
         (guest_id, bed_id, check_in_date, check_out_date, payment_required, amount_due, currency, payment_notes, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        data.guestId,
        data.bedId,
        data.checkInDate,
        data.checkOutDate,
        data.paymentRequired ?? false,
        data.amountDue ?? null,
        data.currency ?? 'TRY',
        data.paymentNotes ?? null,
        data.notes ?? null,
        userId,
      ],
    );
    return this.findById(result.rows[0].id, client);
  }

  async findAll(
    filters: { status?: string; upcoming?: boolean; bedId?: number } = {},
    scope?: LocationScope,
  ): Promise<any[]> {
    let query = `${this.baseSelect} WHERE 1=1`;
    const values: any[] = [];
    let i = 1;

    if (filters.status) {
      values.push(filters.status);
      query += ` AND gs.status = $${i++}`;
    }

    if (filters.upcoming) {
      query += ` AND gs.check_in_date >= CURRENT_DATE AND gs.status = 'confirmed'`;
    }

    if (filters.bedId) {
      values.push(filters.bedId);
      query += ` AND gs.bed_id = $${i++}`;
    }

    const scopeFilter = this.locationScopeService.buildScopeClause(scope, 'r.tree_path', i);
    if (scopeFilter.param) values.push(scopeFilter.param);
    query += ` AND ${scopeFilter.clause}`;

    query += ` ORDER BY gs.check_in_date DESC`;
    const result = await this.db.getPool().query(query, values);
    return result.rows.map((r) => this.map(r));
  }

  async findById(id: string, client?: PoolClient): Promise<any | null> {
    const result = await this.getClient(client).query(`${this.baseSelect} WHERE gs.id = $1`, [id]);
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async update(id: string, data: UpdateGuestStayDto, client?: PoolClient): Promise<any | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (data.checkInDate !== undefined) {
      updates.push(`check_in_date = $${i++}`);
      values.push(data.checkInDate);
    }
    if (data.checkOutDate !== undefined) {
      updates.push(`check_out_date = $${i++}`);
      values.push(data.checkOutDate);
    }
    if (data.paymentRequired !== undefined) {
      updates.push(`payment_required = $${i++}`);
      values.push(data.paymentRequired);
    }
    if (data.amountDue !== undefined) {
      updates.push(`amount_due = $${i++}`);
      values.push(data.amountDue);
    }
    if (data.amountPaid !== undefined) {
      updates.push(`amount_paid = $${i++}`);
      values.push(data.amountPaid);
    }
    if (data.currency !== undefined) {
      updates.push(`currency = $${i++}`);
      values.push(data.currency);
    }
    if (data.paymentNotes !== undefined) {
      updates.push(`payment_notes = $${i++}`);
      values.push(data.paymentNotes);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${i++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) return this.findById(id, client);

    values.push(id);
    await this.getClient(client).query(
      `UPDATE guest_stays SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
      values,
    );
    return this.findById(id, client);
  }

  async checkIn(id: string, client?: PoolClient): Promise<any | null> {
    await this.getClient(client).query(
      `UPDATE guest_stays SET status = 'active', actual_check_in = NOW(), updated_at = NOW() WHERE id = $1`,
      [id],
    );
    return this.findById(id, client);
  }

  async checkOut(id: string, client?: PoolClient): Promise<any | null> {
    await this.getClient(client).query(
      `UPDATE guest_stays SET status = 'completed', actual_check_out = NOW(), updated_at = NOW() WHERE id = $1`,
      [id],
    );
    return this.findById(id, client);
  }

  async cancel(id: string, client?: PoolClient): Promise<any | null> {
    await this.getClient(client).query(
      `UPDATE guest_stays SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [id],
    );
    return this.findById(id, client);
  }
}
