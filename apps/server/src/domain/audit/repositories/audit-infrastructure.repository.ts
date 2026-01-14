import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';

@Injectable()
export class AuditInfrastructureRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  async maintainPartitions(client?: PoolClient): Promise<void> {
    const query = `SELECT audit.maintain_partitions()`;
    await this.getClient(client).query(query);
  }

  async archiveOldPartitions(client?: PoolClient): Promise<void> {
    const query = `SELECT audit.archive_old_partitions(3)`;
    await this.getClient(client).query(query);
  }
}
