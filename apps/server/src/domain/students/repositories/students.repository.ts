import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Student } from '../entities/student.entity';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { FindAllStudentsDto } from '../dto/find-all-students.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

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
      profileData: row.profile_data,
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
        email, phone_number, user_id, created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
}
