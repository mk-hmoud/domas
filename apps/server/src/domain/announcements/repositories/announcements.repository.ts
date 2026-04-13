import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Announcement } from '../entities/announcement.entity';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';

@Injectable()
export class AnnouncementsRepository {
  constructor(private readonly db: DatabaseService) {}

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
    });
  }

  private readonly baseSelect = `
    SELECT a.*,
           CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
    FROM announcements a
    JOIN users u ON u.id = a.created_by
  `;

  async create(data: CreateAnnouncementDto, userId: string): Promise<Announcement> {
    const inserted = await this.db.getPool().query(
      `INSERT INTO announcements (title, body, pinned, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.title, data.body, data.pinned ?? false, data.expiresAt ?? null, userId],
    );
    return this.findById(inserted.rows[0].id) as Promise<Announcement>;
  }

  async findAll(): Promise<Announcement[]> {
    const result = await this.db
      .getPool()
      .query(`${this.baseSelect} ORDER BY a.pinned DESC, a.created_at DESC`);
    return result.rows.map((r) => this.map(r));
  }

  async findPublished(): Promise<Announcement[]> {
    const result = await this.db.getPool().query(
      `${this.baseSelect}
       WHERE a.is_published = TRUE
         AND (a.expires_at IS NULL OR a.expires_at > NOW())
       ORDER BY a.pinned DESC, a.published_at DESC`,
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

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    await this.db
      .getPool()
      .query(
        `UPDATE announcements SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
        values,
      );
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
}
