import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly db: DatabaseService) {}

  async getRecentChanges(limit: number = 50): Promise<any[]> {
    const query = `SELECT * FROM audit.recent_changes LIMIT $1`;
    const result = await this.db.query(query, [limit]);
    return result.rows;
  }

  async getSuspiciousActivity(): Promise<any[]> {
    const query = `SELECT * FROM audit.suspicious_activity`;
    const result = await this.db.query(query);
    return result.rows;
  }

  async getBulkOperations(limit: number = 50): Promise<any[]> {
    const query = `SELECT * FROM audit.bulk_operations LIMIT $1`;
    const result = await this.db.query(query, [limit]);
    return result.rows;
  }
}
