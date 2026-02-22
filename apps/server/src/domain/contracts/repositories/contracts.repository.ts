import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { BookingContract } from '../entities/booking-contract.entity';

@Injectable()
export class ContractsRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  async upsert(
    bookingId: string,
    type: string,
    pdfData: Buffer,
    client?: PoolClient,
  ): Promise<void> {
    const query = `
      INSERT INTO booking_contracts (booking_id, type, pdf_data, file_size, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (booking_id, type) 
      DO UPDATE SET pdf_data = $3, file_size = $4, updated_at = NOW()
    `;
    await this.getClient(client).query(query, [bookingId, type, pdfData, pdfData.length]);
  }

  async findById(
    bookingId: string,
    type: string,
    client?: PoolClient,
  ): Promise<BookingContract | null> {
    const query = `
      SELECT booking_id as "bookingId", type, pdf_data as "pdfData", file_size as "fileSize", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM booking_contracts
      WHERE booking_id = $1 AND type = $2
    `;
    const result = await this.getClient(client).query(query, [bookingId, type]);
    return result.rows[0] ? new BookingContract(result.rows[0]) : null;
  }

  async delete(bookingId: string, type: string, client?: PoolClient): Promise<void> {
    const query = `DELETE FROM booking_contracts WHERE booking_id = $1 AND type = $2`;
    await this.getClient(client).query(query, [bookingId, type]);
  }
}
