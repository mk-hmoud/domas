import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Student } from '../entities/student.entity';
import { EnrollmentVerification } from '../entities/enrollment-verification.entity';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { FindAllStudentsDto } from '../dto/find-all-students.dto';
import { ResolveContactsDto } from '../dto/resolve-contacts.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface ResolvedContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  whatsappNumber?: string;
}

@Injectable()
export class StudentsRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  private mapRowToEntity(row: any): Student {
    return new Student({
      id: row.id,
      userId: row.user_id,
      studentNumber: row.student_number,
      firstName: row.first_name,
      lastName: row.last_name,
      gender: row.gender,
      nationalityCode: row.nationality_code,
      nationalId: row.national_id,
      birthDate: row.birth_date,
      birthPlace: row.birth_place,
      department: row.department,
      email: row.email,
      phoneNumber: row.phone_number,
      whatsappNumber: row.whatsapp_number,
      profileData: row.profile_data,
      photoStorageKey: row.photo_storage_key ?? undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdByUserId: row.created_by_user_id,
    });
  }

  async create(
    data: CreateStudentDto,
    createdByUserId: string,
    client?: PoolClient,
  ): Promise<Student> {
    const query = `
      INSERT INTO students (
        student_number, first_name, last_name, gender, nationality_code, national_id,
        birth_date, birth_place, department,
        email, phone_number, whatsapp_number, user_id, created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const values = [
      data.studentNumber,
      data.firstName,
      data.lastName,
      data.gender,
      data.nationalityCode,
      data.nationalId,
      data.birthDate,
      data.birthPlace,
      data.department,
      data.email || null,
      data.phoneNumber || null,
      data.whatsappNumber || null,
      data.userId || null,
      createdByUserId,
    ];
    const result = await this.getClient(client).query(query, values);
    return this.mapRowToEntity(result.rows[0]);
  }

  async update(id: string, data: UpdateStudentDto, client?: PoolClient): Promise<Student | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const addUpdate = (col: string, val: any) => {
      updates.push(`${col} = $${paramIndex++}`);
      values.push(val);
    };

    if (data.studentNumber) addUpdate('student_number', data.studentNumber);
    if (data.firstName) addUpdate('first_name', data.firstName);
    if (data.lastName) addUpdate('last_name', data.lastName);
    if (data.gender) addUpdate('gender', data.gender);
    if (data.nationalityCode !== undefined) addUpdate('nationality_code', data.nationalityCode);
    if (data.nationalId !== undefined) addUpdate('national_id', data.nationalId);
    if (data.birthDate !== undefined) addUpdate('birth_date', data.birthDate);
    if (data.birthPlace !== undefined) addUpdate('birth_place', data.birthPlace);
    if (data.department !== undefined) addUpdate('department', data.department);
    if (data.email !== undefined) addUpdate('email', data.email);
    if (data.phoneNumber !== undefined) addUpdate('phone_number', data.phoneNumber);
    if (data.whatsappNumber !== undefined) addUpdate('whatsapp_number', data.whatsappNumber);
    if (data.userId !== undefined) addUpdate('user_id', data.userId);
    if (data.isActive !== undefined) addUpdate('is_active', data.isActive);

    if (updates.length === 0) return this.findById(id, client);

    values.push(id);
    const query = `
      UPDATE students 
      SET ${updates.join(', ')}, updated_at = NOW() 
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.getClient(client).query(query, values);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async findById(id: string, client?: PoolClient): Promise<Student | null> {
    const query = `SELECT * FROM students WHERE id = $1 AND deleted_at IS NULL`;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async findAll(dto: FindAllStudentsDto, client?: PoolClient): Promise<PaginatedResult<Student>> {
    const { page = 1, limit = 10, search } = dto;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM students`;
    let countQuery = `SELECT COUNT(*) FROM students`;

    const values: any[] = [];
    const conditions: string[] = ['deleted_at IS NULL'];

    if (search) {
      const idx = values.length + 1;
      conditions.push(`(
            student_number ILIKE $${idx} OR 
            first_name ILIKE $${idx} OR 
            last_name ILIKE $${idx} OR 
            email ILIKE $${idx}
        )`);
      values.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      const where = ` WHERE ${conditions.join(' AND ')}`;
      query += where;
      countQuery += where;
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

    const dbClient = this.getClient(client);
    const [result, countResult] = await Promise.all([
      dbClient.query(query, [...values, limit, offset]),
      dbClient.query<{ count: string }>(countQuery, values),
    ]);

    return {
      data: result.rows.map((row) => this.mapRowToEntity(row)),
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  async findByUserId(userId: string, client?: PoolClient): Promise<Student | null> {
    const query = `SELECT * FROM students WHERE user_id = $1 AND deleted_at IS NULL`;
    const result = await this.getClient(client).query(query, [userId]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async findByStudentNumber(studentNumber: string, client?: PoolClient): Promise<Student | null> {
    const query = `SELECT * FROM students WHERE student_number = $1 AND deleted_at IS NULL`;
    const result = await this.getClient(client).query(query, [studentNumber]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async delete(id: string, client?: PoolClient): Promise<boolean> {
    const query = `UPDATE students SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`;
    const result = await this.getClient(client).query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async deleteMany(ids: string[], client?: PoolClient): Promise<void> {
    const query = `UPDATE students SET deleted_at = NOW() WHERE id = ANY($1) AND deleted_at IS NULL`;
    await this.getClient(client).query(query, [ids]);
  }

  async updateStatusMany(ids: string[], isActive: boolean, client?: PoolClient): Promise<void> {
    const query = `UPDATE students SET is_active = $1 WHERE id = ANY($2) AND deleted_at IS NULL`;
    await this.getClient(client).query(query, [isActive, ids]);
  }

  async resolveContacts(dto: ResolveContactsDto, client?: PoolClient): Promise<ResolvedContact[]> {
    let query: string;
    let params: any[];

    if (dto.scope === 'all') {
      query = `
        SELECT id,
               first_name AS "firstName",
               last_name  AS "lastName",
               email,
               whatsapp_number AS "whatsappNumber"
        FROM students
        WHERE is_active = true AND deleted_at IS NULL
        ORDER BY last_name, first_name
      `;
      params = [];
    } else if (dto.scope === 'location') {
      query = `
        SELECT DISTINCT s.id,
               s.first_name AS "firstName",
               s.last_name  AS "lastName",
               s.email,
               s.whatsapp_number AS "whatsappNumber"
        FROM students s
        JOIN bookings b ON s.id = b.student_id
        JOIN beds bd ON b.bed_id = bd.id
        JOIN locations l ON bd.location_id = l.id
        WHERE b.status = 'active'
          AND l.tree_path <@ (SELECT tree_path FROM locations WHERE id = $1)
        ORDER BY s.last_name, s.first_name
      `;
      params = [dto.locationId];
    } else {
      query = `
        SELECT id,
               first_name AS "firstName",
               last_name  AS "lastName",
               email,
               whatsapp_number AS "whatsappNumber"
        FROM students
        WHERE id = ANY($1) AND deleted_at IS NULL
        ORDER BY last_name, first_name
      `;
      params = [dto.studentIds];
    }

    const result = await this.getClient(client).query(query, params);
    return result.rows;
  }

  async findActiveResidentsByLocation(locationId: number, client?: PoolClient): Promise<any[]> {
    const query = `
      SELECT 
        s.id,
        s.first_name as "firstName",
        s.last_name as "lastName",
        s.student_number as "studentNumber",
        b.id as "bookingId",
        bd.label as "bedLabel",
        l.name as "roomName"
      FROM students s
      JOIN bookings b ON s.id = b.student_id
      JOIN beds bd ON b.bed_id = bd.id
      JOIN locations l ON bd.location_id = l.id
      WHERE b.status = 'active'
        AND l.tree_path <@ (SELECT tree_path FROM locations WHERE id = $1)
      ORDER BY l.tree_path, bd.label
    `;
    const result = await this.getClient(client).query(query, [locationId]);
    return result.rows;
  }

  async setPhotoKey(id: string, key: string, client?: PoolClient): Promise<void> {
    await this.getClient(client).query(
      `UPDATE students SET photo_storage_key = $1, updated_at = NOW() WHERE id = $2`,
      [key, id],
    );
  }

  async clearPhotoKey(id: string, client?: PoolClient): Promise<void> {
    await this.getClient(client).query(
      `UPDATE students SET photo_storage_key = NULL, updated_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  // ─── Enrollment Verifications ─────────────────────────────────────────────────

  private mapEnrollmentRow(row: any): EnrollmentVerification {
    return new EnrollmentVerification({
      id: row.id,
      studentId: row.student_id,
      filename: row.filename,
      mimeType: row.mime_type,
      size: row.size,
      storageKey: row.storage_key,
      status: row.status,
      rejectionReason: row.rejection_reason ?? undefined,
      uploadedAt: row.uploaded_at,
      reviewedAt: row.reviewed_at ?? undefined,
      reviewedBy: row.reviewed_by ?? undefined,
    });
  }

  async insertEnrollmentCert(
    studentId: string,
    data: { filename: string; mimeType: string; size: number; storageKey: string },
  ): Promise<EnrollmentVerification> {
    const result = await this.db.query(
      `INSERT INTO student_enrollment_verifications
         (student_id, filename, mime_type, size, storage_key)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [studentId, data.filename, data.mimeType, data.size, data.storageKey],
    );
    return this.mapEnrollmentRow(result.rows[0]);
  }

  async findEnrollmentCerts(studentId: string): Promise<EnrollmentVerification[]> {
    const result = await this.db.query(
      `SELECT * FROM student_enrollment_verifications
       WHERE student_id = $1 ORDER BY uploaded_at DESC`,
      [studentId],
    );
    return result.rows.map((r) => this.mapEnrollmentRow(r));
  }

  async findEnrollmentCertById(id: string): Promise<EnrollmentVerification | null> {
    const result = await this.db.query(
      `SELECT * FROM student_enrollment_verifications WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? this.mapEnrollmentRow(result.rows[0]) : null;
  }

  async updateEnrollmentCert(
    id: string,
    data: { status: string; rejectionReason?: string; reviewedBy: string },
  ): Promise<EnrollmentVerification> {
    const result = await this.db.query(
      `UPDATE student_enrollment_verifications
       SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [data.status, data.rejectionReason ?? null, data.reviewedBy, id],
    );
    return this.mapEnrollmentRow(result.rows[0]);
  }

  async findLatestEnrollmentCert(studentId: string): Promise<EnrollmentVerification | null> {
    const result = await this.db.query(
      `SELECT * FROM student_enrollment_verifications
       WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
      [studentId],
    );
    return result.rows[0] ? this.mapEnrollmentRow(result.rows[0]) : null;
  }

  async hasVerifiedEnrollment(studentId: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT 1 FROM student_enrollment_verifications
       WHERE student_id = $1 AND status = 'verified' LIMIT 1`,
      [studentId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
