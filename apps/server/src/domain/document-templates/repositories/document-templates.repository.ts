import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { DocumentTemplate, UpdateDocumentTemplateDto } from '@domas/ts-types';

@Injectable()
export class DocumentTemplatesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByTypeAndLanguage(type: string, language: string): Promise<DocumentTemplate | null> {
    const result = await this.db.query(
      `SELECT id, type, language, title, sections,
              is_active as "isActive",
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM document_templates
       WHERE type = $1 AND language = $2`,
      [type, language],
    );
    return result.rows[0] ?? null;
  }

  async findAll(): Promise<DocumentTemplate[]> {
    const result = await this.db.query(
      `SELECT id, type, language, title, sections,
              is_active as "isActive",
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM document_templates
       ORDER BY type, language`,
    );
    return result.rows;
  }

  async findById(id: number): Promise<DocumentTemplate | null> {
    const result = await this.db.query(
      `SELECT id, type, language, title, sections,
              is_active as "isActive",
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM document_templates
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async update(id: number, dto: UpdateDocumentTemplateDto): Promise<DocumentTemplate> {
    const fields: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let idx = 1;

    if (dto.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(dto.title);
    }
    if (dto.sections !== undefined) {
      fields.push(`sections = $${idx++}`);
      values.push(JSON.stringify(dto.sections));
    }

    values.push(id);
    const result = await this.db.query(
      `UPDATE document_templates SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING id, type, language, title, sections,
                 is_active as "isActive",
                 created_at as "createdAt",
                 updated_at as "updatedAt"`,
      values,
    );
    return result.rows[0];
  }
}
