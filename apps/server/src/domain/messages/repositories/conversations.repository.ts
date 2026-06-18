import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMessage } from '../entities/conversation-message.entity';

@Injectable()
export class ConversationsRepository {
  constructor(private readonly db: DatabaseService) {}

  private mapConversation(row: any): Conversation {
    return new Conversation({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentNumber: row.student_number,
      subject: row.subject ?? undefined,
      status: row.status,
      lastMessageAt: row.last_message_at ?? undefined,
      lastMessagePreview: row.last_message_preview ?? undefined,
      unreadByAdmin: row.unread_by_admin,
      unreadByStudent: row.unread_by_student,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Reopening would violate the one-open-conversation-per-student index
      // if the student already moved on to a different open thread.
      canReopen: row.status === 'closed' && !row.has_other_open_conversation,
    });
  }

  private mapMessage(row: any): ConversationMessage {
    return new ConversationMessage({
      id: row.id,
      conversationId: row.conversation_id,
      senderType: row.sender_type,
      senderId: row.sender_id,
      senderName: row.sender_name ?? undefined,
      body: row.body,
      readAt: row.read_at ?? undefined,
      createdAt: row.created_at,
    });
  }

  private readonly conversationSelect = `
    SELECT c.*,
           CONCAT(st.first_name, ' ', st.last_name) AS student_name,
           st.student_number,
           EXISTS (
             SELECT 1 FROM conversations c2
             WHERE c2.student_id = c.student_id AND c2.status = 'open' AND c2.id != c.id
           ) AS has_other_open_conversation
    FROM conversations c
    JOIN students st ON st.id = c.student_id
  `;

  private readonly messagesSelect = `
    SELECT cm.*,
           CASE
             WHEN cm.sender_type = 'student' THEN CONCAT(st.first_name, ' ', st.last_name)
             WHEN cm.sender_type = 'user'    THEN CONCAT(u.first_name, ' ', u.last_name)
           END AS sender_name
    FROM conversation_messages cm
    LEFT JOIN students st ON cm.sender_type = 'student' AND st.id = cm.sender_id
    LEFT JOIN users    u  ON cm.sender_type = 'user'    AND u.id  = cm.sender_id
    WHERE cm.conversation_id = $1
    ORDER BY cm.created_at ASC
  `;

  // ─── Admin queries ──────────────────────────────────────────────────────────

  async findAllForAdmin(filter?: {
    status?: 'open' | 'closed';
    search?: string;
  }): Promise<Conversation[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (filter?.status) {
      conditions.push(`c.status = $${i++}`);
      values.push(filter.status);
    }
    if (filter?.search) {
      conditions.push(
        `(st.first_name ILIKE $${i} OR st.last_name ILIKE $${i} OR st.student_number ILIKE $${i})`,
      );
      values.push(`%${filter.search}%`);
      i++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.db
      .getPool()
      .query(
        `${this.conversationSelect} ${where} ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
        values,
      );
    return result.rows.map((r) => this.mapConversation(r));
  }

  async findByIdForAdmin(id: string): Promise<Conversation | null> {
    const result = await this.db
      .getPool()
      .query(`${this.conversationSelect} WHERE c.id = $1`, [id]);
    if (!result.rows[0]) return null;
    const conversation = this.mapConversation(result.rows[0]);
    conversation.messages = await this.findMessages(id);
    return conversation;
  }

  // ─── Student queries ────────────────────────────────────────────────────────

  async findLatestByStudent(studentId: string): Promise<Conversation | null> {
    const result = await this.db.getPool().query(
      `${this.conversationSelect}
       WHERE c.student_id = $1
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [studentId],
    );
    if (!result.rows[0]) return null;
    const conversation = this.mapConversation(result.rows[0]);
    conversation.messages = await this.findMessages(conversation.id);
    return conversation;
  }

  async findOpenByStudent(studentId: string): Promise<Conversation | null> {
    const result = await this.db
      .getPool()
      .query(`${this.conversationSelect} WHERE c.student_id = $1 AND c.status = 'open'`, [
        studentId,
      ]);
    return result.rows[0] ? this.mapConversation(result.rows[0]) : null;
  }

  async findMessages(conversationId: string): Promise<ConversationMessage[]> {
    const result = await this.db.getPool().query(this.messagesSelect, [conversationId]);
    return result.rows.map((r) => this.mapMessage(r));
  }

  async countUnreadForStudent(studentId: string): Promise<number> {
    const result = await this.db.getPool().query(
      `SELECT COUNT(*)::int AS count
       FROM conversation_messages cm
       JOIN conversations c ON c.id = cm.conversation_id
       WHERE c.student_id = $1
         AND cm.sender_type = 'user'
         AND cm.read_at IS NULL`,
      [studentId],
    );
    return result.rows[0]?.count ?? 0;
  }

  // ─── Writes ─────────────────────────────────────────────────────────────────

  async createConversation(
    studentId: string,
    subject: string | undefined,
    senderType: 'student' | 'user',
    senderId: string,
    body: string,
  ): Promise<{ conversationId: string; messageId: string }> {
    return this.db.transaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO conversations (student_id, subject)
         VALUES ($1, $2)
         RETURNING id`,
        [studentId, subject ?? null],
      );
      const conversationId = inserted.rows[0].id;
      const messageId = await this.insertMessage(
        client,
        conversationId,
        senderType,
        senderId,
        body,
      );
      return { conversationId, messageId };
    });
  }

  async appendMessage(
    conversationId: string,
    senderType: 'student' | 'user',
    senderId: string,
    body: string,
  ): Promise<string> {
    return this.db.transaction((client) =>
      this.insertMessage(client, conversationId, senderType, senderId, body),
    );
  }

  private async insertMessage(
    client: PoolClient,
    conversationId: string,
    senderType: 'student' | 'user',
    senderId: string,
    body: string,
  ): Promise<string> {
    const inserted = await client.query(
      `INSERT INTO conversation_messages (conversation_id, sender_type, sender_id, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [conversationId, senderType, senderId, body],
    );

    const preview = body.length > 200 ? `${body.slice(0, 197)}...` : body;
    await client.query(
      `UPDATE conversations
       SET last_message_at = NOW(),
           last_message_preview = $1,
           unread_by_admin = $2,
           unread_by_student = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [preview, senderType === 'student', senderType === 'user', conversationId],
    );

    return inserted.rows[0].id;
  }

  async markReadByAdmin(conversationId: string): Promise<void> {
    await this.db.transaction(async (client) => {
      await client.query(`UPDATE conversations SET unread_by_admin = FALSE WHERE id = $1`, [
        conversationId,
      ]);
      await client.query(
        `UPDATE conversation_messages
         SET read_at = NOW()
         WHERE conversation_id = $1 AND sender_type = 'student' AND read_at IS NULL`,
        [conversationId],
      );
    });
  }

  async markReadByStudent(studentId: string): Promise<void> {
    await this.db.transaction(async (client) => {
      await client.query(
        `UPDATE conversations SET unread_by_student = FALSE WHERE student_id = $1 AND status = 'open'`,
        [studentId],
      );
      await client.query(
        `UPDATE conversation_messages cm
         SET read_at = NOW()
         FROM conversations c
         WHERE cm.conversation_id = c.id
           AND c.student_id = $1
           AND cm.sender_type = 'user'
           AND cm.read_at IS NULL`,
        [studentId],
      );
    });
  }

  async setStatus(conversationId: string, status: 'open' | 'closed'): Promise<Conversation | null> {
    await this.db
      .getPool()
      .query(`UPDATE conversations SET status = $1, updated_at = NOW() WHERE id = $2`, [
        status,
        conversationId,
      ]);
    return this.findByIdForAdmin(conversationId);
  }
}
