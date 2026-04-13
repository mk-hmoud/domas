import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { Guest } from '../entities/guest.entity';
import { CreateGuestDto } from '../dto/create-guest.dto';
import { UpdateGuestDto } from '../dto/update-guest.dto';

@Injectable()
export class GuestsRepository {
  constructor(private readonly db: DatabaseService) {}

  private map(row: any): Guest {
    return new Guest({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      idNumber: row.id_number,
      email: row.email,
      phone: row.phone,
      notes: row.notes,
      createdAt: row.created_at,
    });
  }

  async create(data: CreateGuestDto): Promise<Guest> {
    const result = await this.db.getPool().query(
      `INSERT INTO guests (first_name, last_name, id_number, email, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.firstName,
        data.lastName,
        data.idNumber ?? null,
        data.email ?? null,
        data.phone ?? null,
        data.notes ?? null,
      ],
    );
    return this.map(result.rows[0]);
  }

  async findAll(search?: string): Promise<Guest[]> {
    let query = `SELECT * FROM guests`;
    const values: any[] = [];

    if (search) {
      values.push(`%${search}%`);
      query += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR id_number ILIKE $1`;
    }

    query += ` ORDER BY last_name, first_name`;
    const result = await this.db.getPool().query(query, values);
    return result.rows.map((r) => this.map(r));
  }

  async findById(id: string): Promise<Guest | null> {
    const result = await this.db.getPool().query(`SELECT * FROM guests WHERE id = $1`, [id]);
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async findByIdNumber(idNumber: string): Promise<Guest | null> {
    const result = await this.db
      .getPool()
      .query(`SELECT * FROM guests WHERE id_number = $1 LIMIT 1`, [idNumber]);
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async update(id: string, data: UpdateGuestDto): Promise<Guest | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (data.firstName !== undefined) {
      updates.push(`first_name = $${i++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      updates.push(`last_name = $${i++}`);
      values.push(data.lastName);
    }
    if (data.idNumber !== undefined) {
      updates.push(`id_number = $${i++}`);
      values.push(data.idNumber);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${i++}`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${i++}`);
      values.push(data.phone);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${i++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const result = await this.db
      .getPool()
      .query(`UPDATE guests SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values);
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }
}
