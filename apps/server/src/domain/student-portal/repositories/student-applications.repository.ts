import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import {
  StudentApplication,
  ApplicationStatus,
  ApplicationDocumentType,
} from '../entities/student-application.entity';

@Injectable()
export class StudentApplicationsRepository {
  constructor(private readonly db: DatabaseService) {}

  private map(row: any): StudentApplication {
    return new StudentApplication({
      id: row.id,
      studentNumber: row.student_number,
      firstName: row.first_name,
      lastName: row.last_name,
      gender: row.gender,
      nationalityCode: row.nationality_code,
      nationalId: row.national_id,
      birthDate: row.birth_date,
      birthPlace: row.birth_place,
      department: row.department,
      email: row.email ?? undefined,
      phoneNumber: row.phone_number ?? undefined,
      whatsappNumber: row.whatsapp_number ?? undefined,
      documentFilename: row.document_filename,
      documentMimeType: row.document_mime_type,
      documentSize: row.document_size,
      documentStorageKey: row.document_storage_key,
      documentType: row.document_type ?? 'freshman',
      documentExpiryDate: row.document_expiry_date ?? undefined,
      status: row.status,
      rejectionReason: row.rejection_reason ?? undefined,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at ?? undefined,
      reviewedBy: row.reviewed_by ?? undefined,
      studentId: row.student_id ?? undefined,
    });
  }

  async insert(
    data: Omit<
      StudentApplication,
      'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'studentId' | 'documentUrl'
    >,
  ): Promise<StudentApplication> {
    const result = await this.db.query(
      `INSERT INTO student_applications
         (student_number, first_name, last_name, gender, nationality_code, national_id,
          birth_date, birth_place, department, email, phone_number, whatsapp_number,
          document_filename, document_mime_type, document_size, document_storage_key,
          document_type, document_expiry_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        data.studentNumber,
        data.firstName,
        data.lastName,
        data.gender,
        data.nationalityCode,
        data.nationalId,
        data.birthDate,
        data.birthPlace,
        data.department,
        data.email ?? null,
        data.phoneNumber ?? null,
        data.whatsappNumber ?? null,
        data.documentFilename,
        data.documentMimeType,
        data.documentSize,
        data.documentStorageKey,
        data.documentType,
        data.documentExpiryDate ?? null,
      ],
    );
    return this.map(result.rows[0]);
  }

  async findById(id: string): Promise<StudentApplication | null> {
    const result = await this.db.query(`SELECT * FROM student_applications WHERE id = $1`, [id]);
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async findAll(filter?: { status?: ApplicationStatus }): Promise<StudentApplication[]> {
    let query = `SELECT * FROM student_applications`;
    const values: any[] = [];
    if (filter?.status) {
      values.push(filter.status);
      query += ` WHERE status = $1`;
    }
    query += ` ORDER BY submitted_at DESC`;
    const result = await this.db.query(query, values);
    return result.rows.map((r) => this.map(r));
  }

  async approve(
    id: string,
    reviewerId: string,
    studentId: string,
    client?: PoolClient,
  ): Promise<StudentApplication> {
    const db = client ?? this.db.getPool();
    const result = await db.query(
      `UPDATE student_applications
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), student_id = $2
       WHERE id = $3
       RETURNING *`,
      [reviewerId, studentId, id],
    );
    return this.map(result.rows[0]);
  }

  async reject(
    id: string,
    reviewerId: string,
    rejectionReason: string,
  ): Promise<StudentApplication> {
    const result = await this.db.query(
      `UPDATE student_applications
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2
       WHERE id = $3
       RETURNING *`,
      [reviewerId, rejectionReason, id],
    );
    return this.map(result.rows[0]);
  }

  async hasPendingForStudentNumber(studentNumber: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT 1 FROM student_applications WHERE student_number = $1 AND status = 'pending' LIMIT 1`,
      [studentNumber],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
