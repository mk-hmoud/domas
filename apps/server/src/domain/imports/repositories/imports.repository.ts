import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';

@Injectable()
export class ImportsRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  async createBatch(
    data: { id: string; filename: string; uploadedBy: string; totalRows: number },
    client?: PoolClient,
  ): Promise<void> {
    const query = `
      INSERT INTO import_batches (id, filename, uploaded_by, total_rows, status)
      VALUES ($1, $2, $3, $4, 'processing')
    `;
    await this.getClient(client).query(query, [
      data.id,
      data.filename,
      data.uploadedBy,
      data.totalRows,
    ]);
  }

  async updateBatch(
    id: string,
    data: { successfulRows: number; failedRows: number; status: string; results: any },
    client?: PoolClient,
  ): Promise<void> {
    const query = `
      UPDATE import_batches 
      SET successful_rows = $1, 
          failed_rows = $2, 
          status = $3,
          results = $4,
          completed_at = NOW()
      WHERE id = $5
    `;
    await this.getClient(client).query(query, [
      data.successfulRows,
      data.failedRows,
      data.status,
      JSON.stringify(data.results),
      id,
    ]);
  }

  async validateNationality(code: string, client?: PoolClient): Promise<boolean> {
    const query = 'SELECT 1 FROM countries WHERE code = $1';
    const result = await this.getClient(client).query(query, [code]);
    return (result.rowCount ?? 0) > 0;
  }

  async validateDepartment(nameEn: string, client?: PoolClient): Promise<boolean> {
    const query = 'SELECT 1 FROM departments WHERE name_en = $1';
    const result = await this.getClient(client).query(query, [nameEn]);
    return (result.rowCount ?? 0) > 0;
  }
}
