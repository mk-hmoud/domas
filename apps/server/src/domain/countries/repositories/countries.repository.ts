import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { Country } from '../entities/country.entity';
import { CreateCountryDto, UpdateCountryDto } from '../dto/country.dto';

@Injectable()
export class CountriesRepository {
  constructor(private readonly db: DatabaseService) {}

  private map(row: any): Country {
    return new Country({
      code: row.code,
      nameEn: row.name_en,
      nameTr: row.name_tr,
      createdAt: row.created_at,
    });
  }

  private readonly selectColumns = `code, name_en, name_tr, created_at`;

  async findAll(): Promise<Country[]> {
    const result = await this.db.query(
      `SELECT ${this.selectColumns} FROM countries ORDER BY name_en`,
    );
    return result.rows.map((row) => this.map(row));
  }

  async findByCode(code: string): Promise<Country | null> {
    const result = await this.db.query(
      `SELECT ${this.selectColumns} FROM countries WHERE code = $1`,
      [code],
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async create(data: CreateCountryDto): Promise<Country> {
    const result = await this.db.query(
      `INSERT INTO countries (code, name_en, name_tr)
       VALUES ($1, $2, $3)
       RETURNING ${this.selectColumns}`,
      [data.code, data.nameEn, data.nameTr],
    );
    return this.map(result.rows[0]);
  }

  async update(code: string, data: UpdateCountryDto): Promise<Country | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let p = 1;

    const add = (col: string, val: any) => {
      updates.push(`${col} = $${p++}`);
      values.push(val);
    };

    if (data.nameEn !== undefined) add('name_en', data.nameEn);
    if (data.nameTr !== undefined) add('name_tr', data.nameTr);

    if (updates.length === 0) return this.findByCode(code);

    values.push(code);
    const result = await this.db.query(
      `UPDATE countries SET ${updates.join(', ')} WHERE code = $${p} RETURNING ${this.selectColumns}`,
      values,
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async delete(code: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM countries WHERE code = $1`, [code]);
    return (result.rowCount ?? 0) > 0;
  }
}
