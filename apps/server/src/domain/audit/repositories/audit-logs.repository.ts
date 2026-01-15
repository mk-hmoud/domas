import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { SearchAuditDto } from '../dto/search-audit.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { AuditLogEntry } from '../entities/audit-log-entry.entity';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly db: DatabaseService) {}

  async search(dto: SearchAuditDto): Promise<PaginatedResult<AuditLogEntry>> {
    const { page = 1, limit = 20, startDate, endDate, actions, userId, tableName, search } = dto;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM audit.event_log`;
    let countQuery = `SELECT COUNT(*) FROM audit.event_log`;

    const conditions: string[] = [];
    const values: any[] = [];

    // General Search
    if (search) {
      const searchParamIndex = values.length + 1;
      conditions.push(`(
        username ILIKE $${searchParamIndex} OR
        table_name ILIKE $${searchParamIndex} OR
        operation_context ILIKE $${searchParamIndex} OR
        query_text ILIKE $${searchParamIndex}
      )`);
      values.push(`%${search}%`);
    }

    // Date Filtering (Crucial for Partition Pruning)
    if (startDate) {
      conditions.push(`event_timestamp >= $${values.length + 1}`);
      values.push(startDate);
    }
    if (endDate) {
      conditions.push(`event_timestamp <= $${values.length + 1}`);
      values.push(endDate);
    }

    if (actions && actions.length > 0) {
      conditions.push(`action = ANY($${values.length + 1})`);
      values.push(actions);
    }

    if (userId) {
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(userId);
    }

    if (tableName) {
      conditions.push(`table_name = $${values.length + 1}`);
      values.push(tableName);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY event_timestamp DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

    // Execute
    const [result, countResult] = await Promise.all([
      this.db.query<AuditLogEntry>(query, [...values, limit, offset]),
      this.db.query<{ count: string }>(countQuery, values),
    ]);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

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
