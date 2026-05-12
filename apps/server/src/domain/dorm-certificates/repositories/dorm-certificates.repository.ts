import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import {
  DormCertificateRequest,
  DormCertificateRequestStatus,
} from '../entities/dorm-certificate-request.entity';

@Injectable()
export class DormCertificatesRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient) {
    return client ?? this.db.getPool();
  }

  private map(row: any): DormCertificateRequest {
    return new DormCertificateRequest({
      id: row.id,
      studentId: row.student_id,
      enrollmentVerificationId: row.enrollment_verification_id ?? undefined,
      status: row.status,
      rejectionReason: row.rejection_reason ?? undefined,
      certificateStorageKey: row.certificate_storage_key ?? undefined,
      certificateFilename: row.certificate_filename ?? undefined,
      requestedAt: row.requested_at,
      reviewedAt: row.reviewed_at ?? undefined,
      reviewedBy: row.reviewed_by ?? undefined,
    });
  }

  async insert(
    studentId: string,
    enrollmentVerificationId: string | null,
    client?: PoolClient,
  ): Promise<DormCertificateRequest> {
    const result = await this.getClient(client).query(
      `INSERT INTO dorm_certificate_requests (student_id, enrollment_verification_id)
       VALUES ($1, $2)
       RETURNING *`,
      [studentId, enrollmentVerificationId],
    );
    return this.map(result.rows[0]);
  }

  async findById(id: string, client?: PoolClient): Promise<DormCertificateRequest | null> {
    const result = await this.getClient(client).query(
      `SELECT * FROM dorm_certificate_requests WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async findByStudent(studentId: string, client?: PoolClient): Promise<DormCertificateRequest[]> {
    const result = await this.getClient(client).query(
      `SELECT * FROM dorm_certificate_requests WHERE student_id = $1 ORDER BY requested_at DESC`,
      [studentId],
    );
    return result.rows.map((r) => this.map(r));
  }

  async findAll(
    filter?: { status?: DormCertificateRequestStatus },
    client?: PoolClient,
  ): Promise<DormCertificateRequest[]> {
    let query = `
      SELECT r.*, s.first_name, s.last_name, s.student_number
      FROM dorm_certificate_requests r
      JOIN students s ON s.id = r.student_id
    `;
    const values: any[] = [];
    if (filter?.status) {
      values.push(filter.status);
      query += ` WHERE r.status = $1`;
    }
    query += ` ORDER BY r.requested_at DESC`;
    const result = await this.getClient(client).query(query, values);
    return result.rows.map((row) => ({
      ...this.map(row),
      studentName: `${row.first_name} ${row.last_name}`,
      studentNumber: row.student_number,
    })) as any[];
  }

  async hasPendingForStudent(studentId: string, client?: PoolClient): Promise<boolean> {
    const result = await this.getClient(client).query(
      `SELECT 1 FROM dorm_certificate_requests WHERE student_id = $1 AND status = 'pending' LIMIT 1`,
      [studentId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async approve(
    id: string,
    reviewerId: string,
    certificateStorageKey: string,
    certificateFilename: string,
    client?: PoolClient,
  ): Promise<DormCertificateRequest> {
    const result = await this.getClient(client).query(
      `UPDATE dorm_certificate_requests
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(),
           certificate_storage_key = $2, certificate_filename = $3
       WHERE id = $4
       RETURNING *`,
      [reviewerId, certificateStorageKey, certificateFilename, id],
    );
    return this.map(result.rows[0]);
  }

  async reject(
    id: string,
    reviewerId: string,
    rejectionReason: string,
    client?: PoolClient,
  ): Promise<DormCertificateRequest> {
    const result = await this.getClient(client).query(
      `UPDATE dorm_certificate_requests
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2
       WHERE id = $3
       RETURNING *`,
      [reviewerId, rejectionReason, id],
    );
    return this.map(result.rows[0]);
  }
}
