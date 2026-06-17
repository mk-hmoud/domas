import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { StorageService } from '../../../common/storage/storage.service';
import { Announcement } from '../entities/announcement.entity';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';
import { AnnouncementTargetDto } from '../dto/announcement-target.dto';

@Injectable()
export class AnnouncementsRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
  ) {}

  private map(row: any): Announcement {
    return new Announcement({
      id: row.id,
      title: row.title,
      body: row.body,
      pinned: row.pinned,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      expiresAt: row.expires_at,
      createdBy: row.created_by,
      createdByName: row.created_by_name ?? '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      attachments: row.attachments ?? [],
      audienceMode: row.audience_mode,
      targets: row.targets ?? [],
    });
  }

  private readonly attachmentsSubquery = `
    COALESCE((
      SELECT json_agg(json_build_object(
        'id',             aa.id,
        'announcementId', aa.announcement_id,
        'filename',       aa.filename,
        'mimeType',       aa.mime_type,
        'size',           aa.size,
        'createdAt',      aa.created_at
      ) ORDER BY aa.created_at ASC)
      FROM announcement_attachments aa
      WHERE aa.announcement_id = a.id
    ), '[]'::json) AS attachments
  `;

  private readonly targetsSubquery = `
    COALESCE((
      SELECT json_agg(json_build_object(
        'id',                  t.id,
        'targetType',          t.target_type,
        'studentId',           t.student_id,
        'studentName',         CASE WHEN t.student_id IS NOT NULL
                                  THEN CONCAT(st.first_name, ' ', st.last_name) END,
        'semesterId',          t.semester_id,
        'semesterDisplayName', sem.display_name,
        'locationId',          t.location_id,
        'locationName',        loc.name,
        'locationPath',        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> loc.tree_path
            AND  anc.deleted_at IS NULL
        )
      ) ORDER BY t.created_at ASC)
      FROM announcement_targets t
      LEFT JOIN students  st  ON st.id  = t.student_id
      LEFT JOIN semesters sem ON sem.id = t.semester_id
      LEFT JOIN locations loc ON loc.id = t.location_id
      WHERE t.announcement_id = a.id
    ), '[]'::json) AS targets
  `;

  private readonly baseSelect = `
    SELECT a.*,
           CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
           ${this.attachmentsSubquery},
           ${this.targetsSubquery}
    FROM announcements a
    JOIN users u ON u.id = a.created_by
  `;

  private async insertTargets(
    client: PoolClient,
    announcementId: string,
    targets: AnnouncementTargetDto[],
  ): Promise<void> {
    for (const target of targets) {
      await client.query(
        `INSERT INTO announcement_targets (announcement_id, target_type, student_id, semester_id, location_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          announcementId,
          target.targetType,
          target.targetType === 'student' ? target.studentId : null,
          target.targetType === 'semester' ? target.semesterId : null,
          target.targetType === 'location' ? target.locationId : null,
        ],
      );
    }
  }

  async create(data: CreateAnnouncementDto, userId: string): Promise<Announcement> {
    const id = await this.db.transaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO announcements (title, body, pinned, expires_at, created_by, audience_mode)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          data.title,
          data.body,
          data.pinned ?? false,
          data.expiresAt ?? null,
          userId,
          data.audienceMode ?? 'all',
        ],
      );
      const announcementId = inserted.rows[0].id;
      if (data.targets && data.targets.length > 0) {
        await this.insertTargets(client, announcementId, data.targets);
      }
      return announcementId;
    });
    return this.findById(id) as Promise<Announcement>;
  }

  async findAll(): Promise<Announcement[]> {
    const result = await this.db
      .getPool()
      .query(`${this.baseSelect} ORDER BY a.pinned DESC, a.created_at DESC`);
    return result.rows.map((r) => this.map(r));
  }

  /**
   * Published announcements visible to a specific student: broadcast ('all')
   * announcements, plus any 'targeted' announcement the student matches via
   * a direct student target, their current booking's semester, or a
   * location target that is an ancestor of their current room.
   */
  async findPublishedForStudent(studentId: string): Promise<Announcement[]> {
    const result = await this.db.getPool().query(
      `WITH student_ctx AS (
         SELECT bk.semester_id, l.tree_path
         FROM   bookings bk
         JOIN   beds      bd ON bd.id = bk.bed_id
         JOIN   locations l  ON l.id  = bd.location_id
         WHERE  bk.student_id = $1
           AND  bk.status NOT IN ('cancelled', 'rejected', 'completed', 'transferred')
         ORDER BY bk.created_at DESC
         LIMIT 1
       )
       ${this.baseSelect}
       LEFT JOIN student_ctx sc ON TRUE
       WHERE a.is_published = TRUE
         AND (a.expires_at IS NULL OR a.expires_at > NOW())
         AND (
           a.audience_mode = 'all'
           OR EXISTS (
             SELECT 1 FROM announcement_targets t
             WHERE t.announcement_id = a.id
               AND (
                    (t.target_type = 'student'  AND t.student_id  = $1)
                 OR (t.target_type = 'semester' AND t.semester_id = sc.semester_id)
                 OR (t.target_type = 'location' AND sc.tree_path IS NOT NULL
                       AND EXISTS (
                         SELECT 1 FROM locations tl
                         WHERE tl.id = t.location_id AND tl.tree_path @> sc.tree_path
                       ))
               )
           )
         )
       ORDER BY a.pinned DESC, a.published_at DESC`,
      [studentId],
    );
    return result.rows.map((r) => this.map(r));
  }

  async findById(id: string): Promise<Announcement | null> {
    const result = await this.db.getPool().query(`${this.baseSelect} WHERE a.id = $1`, [id]);
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async update(id: string, data: UpdateAnnouncementDto): Promise<Announcement | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${i++}`);
      values.push(data.title);
    }
    if (data.body !== undefined) {
      updates.push(`body = $${i++}`);
      values.push(data.body);
    }
    if (data.pinned !== undefined) {
      updates.push(`pinned = $${i++}`);
      values.push(data.pinned);
    }
    if ('expiresAt' in data) {
      updates.push(`expires_at = $${i++}`);
      values.push(data.expiresAt ?? null);
    }
    if (data.audienceMode !== undefined) {
      updates.push(`audience_mode = $${i++}`);
      values.push(data.audienceMode);
    }

    if (updates.length === 0 && data.targets === undefined) return this.findById(id);

    await this.db.transaction(async (client) => {
      if (updates.length > 0) {
        const vals = [...values, id];
        await client.query(
          `UPDATE announcements SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
          vals,
        );
      }
      if (data.targets !== undefined) {
        await client.query(`DELETE FROM announcement_targets WHERE announcement_id = $1`, [id]);
        if (data.targets.length > 0) {
          await this.insertTargets(client, id, data.targets);
        }
      }
    });
    return this.findById(id);
  }

  async publish(id: string): Promise<Announcement | null> {
    await this.db.getPool().query(
      `UPDATE announcements
       SET is_published = TRUE, published_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [id],
    );
    return this.findById(id);
  }

  async unpublish(id: string): Promise<Announcement | null> {
    await this.db.getPool().query(
      `UPDATE announcements
       SET is_published = FALSE, published_at = NULL, updated_at = NOW()
       WHERE id = $1`,
      [id],
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.getPool().query(`DELETE FROM announcements WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ─── Attachments ─────────────────────────────────────────────────────────────

  async createAttachments(announcementId: string, files: Express.Multer.File[]): Promise<void> {
    for (const file of files) {
      const id = randomUUID();
      const key = `announcements/${announcementId}/${id}`;
      await this.storage.upload(key, file.buffer, file.mimetype);
      await this.db.getPool().query(
        `INSERT INTO announcement_attachments (id, announcement_id, filename, mime_type, size, storage_key)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, announcementId, file.originalname, file.mimetype, file.size, key],
      );
    }
  }

  async findAttachmentById(
    attachmentId: string,
    announcementId: string,
  ): Promise<{ id: string; filename: string; mimeType: string; data: Buffer } | null> {
    const result = await this.db.getPool().query(
      `SELECT id, filename, mime_type AS "mimeType", storage_key AS "storageKey"
       FROM announcement_attachments
       WHERE id = $1 AND announcement_id = $2`,
      [attachmentId, announcementId],
    );
    if (!result.rows[0]) return null;
    const { id, filename, mimeType, storageKey } = result.rows[0];
    const data = await this.storage.download(storageKey);
    return { id, filename, mimeType, data };
  }

  async deleteAttachment(attachmentId: string, announcementId: string): Promise<boolean> {
    const result = await this.db.getPool().query(
      `SELECT storage_key AS "storageKey" FROM announcement_attachments
       WHERE id = $1 AND announcement_id = $2`,
      [attachmentId, announcementId],
    );
    if (!result.rows[0]) return false;
    await this.storage.delete(result.rows[0].storageKey);
    await this.db
      .getPool()
      .query(`DELETE FROM announcement_attachments WHERE id = $1 AND announcement_id = $2`, [
        attachmentId,
        announcementId,
      ]);
    return true;
  }
}
