import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { Department } from '../entities/department.entity';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../dto/department.dto';

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly db: DatabaseService) {}

  private map(row: any): Department {
    return new Department({
      nameEn: row.name_en,
      nameTr: row.name_tr,
      createdAt: row.created_at,
    });
  }

  private readonly selectColumns = `name_en, name_tr, created_at`;

  async findAll(): Promise<Department[]> {
    const result = await this.db.query(
      `SELECT ${this.selectColumns} FROM departments ORDER BY name_en`,
    );
    return result.rows.map((row) => this.map(row));
  }

  async findByName(nameEn: string): Promise<Department | null> {
    const result = await this.db.query(
      `SELECT ${this.selectColumns} FROM departments WHERE name_en = $1`,
      [nameEn],
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async create(data: CreateDepartmentDto): Promise<Department> {
    const result = await this.db.query(
      `INSERT INTO departments (name_en, name_tr)
       VALUES ($1, $2)
       RETURNING ${this.selectColumns}`,
      [data.nameEn, data.nameTr],
    );
    return this.map(result.rows[0]);
  }

  // Renaming name_en cascades to students.department via ON UPDATE CASCADE.
  async update(nameEn: string, data: UpdateDepartmentDto): Promise<Department | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let p = 1;

    const add = (col: string, val: any) => {
      updates.push(`${col} = $${p++}`);
      values.push(val);
    };

    if (data.nameEn !== undefined) add('name_en', data.nameEn);
    if (data.nameTr !== undefined) add('name_tr', data.nameTr);

    if (updates.length === 0) return this.findByName(nameEn);

    values.push(nameEn);
    const result = await this.db.query(
      `UPDATE departments SET ${updates.join(', ')} WHERE name_en = $${p} RETURNING ${this.selectColumns}`,
      values,
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async delete(nameEn: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM departments WHERE name_en = $1`, [nameEn]);
    return (result.rowCount ?? 0) > 0;
  }
}
