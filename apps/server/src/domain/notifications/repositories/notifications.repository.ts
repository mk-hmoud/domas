import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';

export interface CreateNotificationData {
  studentId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface StudentNotification {
  id: string;
  studentId: string;
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

  async create(data: CreateNotificationData): Promise<StudentNotification> {
    const query = `
      INSERT INTO student_notifications (student_id, type, title, body, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        student_id  AS "studentId",
        type,
        title,
        body,
        metadata,
        read_at     AS "readAt",
        created_at  AS "createdAt"
    `;
    const result = await this.db
      .getPool()
      .query(query, [
        data.studentId,
        data.type,
        data.title,
        data.body,
        JSON.stringify(data.metadata ?? {}),
      ]);
    return result.rows[0];
  }

  async findByStudent(studentId: string, limit = 30, offset = 0): Promise<StudentNotification[]> {
    const query = `
      SELECT
        id,
        student_id  AS "studentId",
        type,
        title,
        body,
        metadata,
        read_at     AS "readAt",
        created_at  AS "createdAt"
      FROM student_notifications
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.db.getPool().query(query, [studentId, limit, offset]);
    return result.rows;
  }

  async countUnread(studentId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) FROM student_notifications
      WHERE student_id = $1 AND read_at IS NULL
    `;
    const result = await this.db.getPool().query<{ count: string }>(query, [studentId]);
    return parseInt(result.rows[0].count, 10);
  }

  async markAsRead(id: string, studentId: string): Promise<boolean> {
    const query = `
      UPDATE student_notifications
      SET read_at = NOW()
      WHERE id = $1 AND student_id = $2 AND read_at IS NULL
    `;
    const result = await this.db.getPool().query(query, [id, studentId]);
    return (result.rowCount ?? 0) > 0;
  }

  async markAllAsRead(studentId: string): Promise<void> {
    const query = `
      UPDATE student_notifications
      SET read_at = NOW()
      WHERE student_id = $1 AND read_at IS NULL
    `;
    await this.db.getPool().query(query, [studentId]);
  }
}
