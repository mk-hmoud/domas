import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';

@Injectable()
export class AuditInfrastructureRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  async createSemesterPartition(
    name: string,
    startDate: string,
    endDate: string,
    client?: PoolClient,
  ): Promise<void> {
    const query = `SELECT audit.create_semester_partition($1, $2, $3)`;
    await this.getClient(client).query(query, [name, startDate, endDate]);
  }
}
