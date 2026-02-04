import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { UndoLog } from '../entities/undo-log.entity';

@Injectable()
export class UndoRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  private getSelectColumns(alias = 'l'): string {
    return `
      ${alias}.id, 
      ${alias}.event_timestamp as "eventTimestamp", 
      ${alias}.user_id as "userId", 
      u.email as "performedByEmail",
      TRIM(CONCAT(u.first_name, ' ', u.last_name)) as "performedByName",
      ${alias}.session_id as "sessionId", 
      ${alias}.action_type as "actionType", 
      ${alias}.entity_type as "entityType", 
      ${alias}.entity_id as "entityId", 
      ${alias}.undo_data as "undoData", 
      ${alias}.redo_data as "redoData", 
      ${alias}.description, 
      ${alias}.undone_at as "undoneAt", 
      ${alias}.undone_by as "undoneBy", 
      ${alias}.expires_at as "expiresAt", 
      ${alias}.deleted_at as "deletedAt"
    `;
  }

  async create(data: Partial<UndoLog>, client?: PoolClient): Promise<UndoLog> {
    const query = `
      INSERT INTO audit.undo_log (
        user_id, session_id, action_type, entity_type, entity_id, undo_data, redo_data, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, 
        event_timestamp as "eventTimestamp", 
        user_id as "userId", 
        session_id as "sessionId", 
        action_type as "actionType", 
        entity_type as "entityType", 
        entity_id as "entityId", 
        undo_data as "undoData", 
        redo_data as "redoData", 
        description, 
        undone_at as "undoneAt", 
        undone_by as "undoneBy", 
        expires_at as "expiresAt", 
        deleted_at as "deletedAt"
    `;
    const values = [
      data.userId,
      data.sessionId || null,
      data.actionType,
      data.entityType,
      data.entityId,
      data.undoData,
      data.redoData || null,
      data.description || null,
    ];

    const result = await this.getClient(client).query(query, values);
    return new UndoLog(result.rows[0]);
  }

  async findById(id: string, client?: PoolClient): Promise<UndoLog | null> {
    const query = `
      SELECT ${this.getSelectColumns()}
      FROM audit.undo_log l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.id = $1 AND l.deleted_at IS NULL
    `;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ? new UndoLog(result.rows[0]) : null;
  }

  async markAsUndone(id: string, userId: string, client?: PoolClient): Promise<void> {
    const query = `
      UPDATE audit.undo_log
      SET undone_at = NOW(), undone_by = $2
      WHERE id = $1 AND undone_at IS NULL
    `;
    await this.getClient(client).query(query, [id, userId]);
  }

  async findLatestForUser(userId: string, limit = 10): Promise<UndoLog[]> {
    const query = `
      SELECT ${this.getSelectColumns()}
      FROM audit.undo_log l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.user_id = $1 AND l.undone_at IS NULL AND l.deleted_at IS NULL AND l.expires_at > NOW()
      ORDER BY l.event_timestamp DESC
      LIMIT $2
    `;
    const result = await this.db.query(query, [userId, limit]);
    return result.rows.map((r) => new UndoLog(r));
  }

  async findAllRecent(
    limit = 10,
    options: { excludeRecovery?: boolean; excludeAdmins?: boolean } = {},
  ): Promise<UndoLog[]> {
    const filters: string[] = [];

    if (options.excludeRecovery) {
      filters.push(`
        AND NOT EXISTS (
          SELECT 1 FROM users u_check 
          WHERE u_check.id = l.user_id AND u_check.is_recovery_admin = TRUE
        )
      `);
    }

    if (options.excludeAdmins) {
      filters.push(`
        AND NOT EXISTS (
          SELECT 1 FROM user_roles ur_check
          JOIN roles r_check ON ur_check.role_id = r_check.id
          WHERE ur_check.user_id = l.user_id AND r_check.name = 'Admin'
        )
      `);
    }

    const query = `
      SELECT ${this.getSelectColumns()}
      FROM audit.undo_log l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.undone_at IS NULL AND l.deleted_at IS NULL AND l.expires_at > NOW()
      ${filters.join(' ')}
      ORDER BY l.event_timestamp DESC
      LIMIT $1
    `;
    const result = await this.db.query(query, [limit]);
    return result.rows.map((r) => new UndoLog(r));
  }
}
