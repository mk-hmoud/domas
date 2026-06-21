import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { DocumentTemplate } from '../entities/document-template.entity';

@Injectable()
export class DocumentTemplatesRepository {
  constructor(private readonly db: DatabaseService) {}

  private map(row: any): DocumentTemplate {
    return new DocumentTemplate({
      id: row.id,
      documentType: row.document_type,
      language: row.language,
      name: row.name,
      htmlBody: row.html_body,
      css: row.css,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdByName: row.created_by_name ?? undefined,
      createdAt: row.created_at,
    });
  }

  private readonly selectColumns = `
    dt.id, dt.document_type, dt.language, dt.name, dt.html_body, dt.css, dt.is_active,
    dt.created_by, dt.created_at,
    NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), '') AS created_by_name
  `;

  async create(
    data: { documentType: string; language: string; name: string; htmlBody: string; css: string },
    createdBy: string,
  ): Promise<DocumentTemplate> {
    const result = await this.db.query(
      `INSERT INTO document_templates (document_type, language, name, html_body, css, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, document_type, language, name, html_body, css, is_active, created_by, created_at`,
      [data.documentType, data.language, data.name, data.htmlBody, data.css, createdBy],
    );
    return this.map(result.rows[0]);
  }

  async findVersions(documentType: string, language: string): Promise<DocumentTemplate[]> {
    const result = await this.db.query(
      `SELECT ${this.selectColumns}
       FROM document_templates dt
       LEFT JOIN users u ON u.id = dt.created_by
       WHERE dt.document_type = $1 AND dt.language = $2
       ORDER BY dt.created_at DESC`,
      [documentType, language],
    );
    return result.rows.map((row) => this.map(row));
  }

  async findById(id: string): Promise<DocumentTemplate | null> {
    const result = await this.db.query(
      `SELECT ${this.selectColumns}
       FROM document_templates dt
       LEFT JOIN users u ON u.id = dt.created_by
       WHERE dt.id = $1`,
      [id],
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async findActiveByType(documentType: string, language: string): Promise<DocumentTemplate | null> {
    const result = await this.db.query(
      `SELECT ${this.selectColumns}
       FROM document_templates dt
       LEFT JOIN users u ON u.id = dt.created_by
       WHERE dt.document_type = $1 AND dt.language = $2 AND dt.is_active = TRUE`,
      [documentType, language],
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async publish(id: string): Promise<DocumentTemplate> {
    return this.db.transaction(async (client) => {
      const target = await client.query(
        'SELECT document_type, language FROM document_templates WHERE id = $1',
        [id],
      );
      if (!target.rows[0]) throw new NotFoundException('Template version not found');

      const { document_type: documentType, language } = target.rows[0];
      await client.query(
        'UPDATE document_templates SET is_active = FALSE WHERE document_type = $1 AND language = $2 AND is_active = TRUE',
        [documentType, language],
      );
      await client.query('UPDATE document_templates SET is_active = TRUE WHERE id = $1', [id]);

      const result = await client.query(
        `SELECT ${this.selectColumns}
         FROM document_templates dt
         LEFT JOIN users u ON u.id = dt.created_by
         WHERE dt.id = $1`,
        [id],
      );
      return this.map(result.rows[0]);
    });
  }

  async unpublish(documentType: string, language: string): Promise<void> {
    await this.db.query(
      'UPDATE document_templates SET is_active = FALSE WHERE document_type = $1 AND language = $2 AND is_active = TRUE',
      [documentType, language],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM document_templates WHERE id = $1', [id]);
  }
}
