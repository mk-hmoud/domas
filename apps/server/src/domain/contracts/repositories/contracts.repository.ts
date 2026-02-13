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

  async upsert(bookingId: string, pdfData: Buffer, client?: PoolClient): Promise<void> {
    const query = `
      INSERT INTO booking_contracts (booking_id, pdf_data, file_size, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (booking_id) 
      DO UPDATE SET pdf_data = $2, file_size = $3, updated_at = NOW()
    `;
    await this.getClient(client).query(query, [bookingId, pdfData, pdfData.length]);
  }

  async findByBookingId(bookingId: string, client?: PoolClient): Promise<BookingContract | null> {
    const query = `
      SELECT booking_id as "bookingId", pdf_data as "pdfData", file_size as "fileSize", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM booking_contracts
      WHERE booking_id = $1
    `;
    const result = await this.getClient(client).query(query, [bookingId]);
    return result.rows[0] ? new BookingContract(result.rows[0]) : null;
  }

  async delete(bookingId: string, client?: PoolClient): Promise<void> {
    const query = `DELETE FROM booking_contracts WHERE booking_id = $1`;
    await this.getClient(client).query(query, [bookingId]);
  }
}
