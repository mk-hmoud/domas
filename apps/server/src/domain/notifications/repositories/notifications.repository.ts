import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';

export interface CreateNotificationData {
  recipientType: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  recipientType: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
  readAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const query = `
      INSERT INTO notifications (recipient_type, recipient_id, type, title, body, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        recipient_type  AS "recipientType",
        recipient_id    AS "recipientId",
        type,
        title,
        body,
        metadata,
        read_at         AS "readAt",
        created_at      AS "createdAt"
    `;
    const result = await this.db
      .getPool()
      .query(query, [
        data.recipientType,
        data.recipientId,
        data.type,
        data.title,
        data.body,
        JSON.stringify(data.metadata ?? {}),
      ]);
    return result.rows[0];
  }

  async findByRecipient(
    recipientType: string,
    recipientId: string,
    limit = 30,
    offset = 0,
  ): Promise<Notification[]> {
    const query = `
      SELECT
        id,
        recipient_type  AS "recipientType",
        recipient_id    AS "recipientId",
        type,
        title,
        body,
        metadata,
        read_at         AS "readAt",
        created_at      AS "createdAt"
      FROM notifications
      WHERE recipient_type = $1 AND recipient_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await this.db
      .getPool()
      .query(query, [recipientType, recipientId, limit, offset]);
    return result.rows;
  }

  async countUnread(recipientType: string, recipientId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) FROM notifications
      WHERE recipient_type = $1 AND recipient_id = $2 AND read_at IS NULL
    `;
    const result = await this.db
      .getPool()
      .query<{ count: string }>(query, [recipientType, recipientId]);
    return parseInt(result.rows[0].count, 10);
  }

  async markAsRead(id: string, recipientType: string, recipientId: string): Promise<boolean> {
    const query = `
      UPDATE notifications
      SET read_at = NOW()
      WHERE id = $1 AND recipient_type = $2 AND recipient_id = $3 AND read_at IS NULL
    `;
    const result = await this.db.getPool().query(query, [id, recipientType, recipientId]);
    return (result.rowCount ?? 0) > 0;
  }

  async markAllAsRead(recipientType: string, recipientId: string): Promise<void> {
    const query = `
      UPDATE notifications
      SET read_at = NOW()
      WHERE recipient_type = $1 AND recipient_id = $2 AND read_at IS NULL
    `;
    await this.db.getPool().query(query, [recipientType, recipientId]);
  }
}
