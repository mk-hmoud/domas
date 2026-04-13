import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { RoomType } from '../entities/room-type.entity';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../dto/room-type.dto';

@Injectable()
export class RoomTypesRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  private get selectColumns(): string {
    return `
      id,
      name,
      description,
      gallery_urls  AS "galleryUrls",
      amenities,
      capacity,
      created_at    AS "createdAt",
      updated_at    AS "updatedAt"
    `;
  }

  async findAll(client?: PoolClient): Promise<RoomType[]> {
    const result = await this.getClient(client).query<RoomType>(
      `SELECT ${this.selectColumns} FROM room_types ORDER BY name`,
    );
    return result.rows.map((r) => new RoomType(r));
  }

  async findById(id: number, client?: PoolClient): Promise<RoomType | null> {
    const result = await this.getClient(client).query<RoomType>(
      `SELECT ${this.selectColumns} FROM room_types WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? new RoomType(result.rows[0]) : null;
  }

  async create(data: CreateRoomTypeDto, client?: PoolClient): Promise<RoomType> {
    const result = await this.getClient(client).query<RoomType>(
      `INSERT INTO room_types (name, description, gallery_urls, amenities, capacity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${this.selectColumns}`,
      [
        data.name,
        data.description ?? null,
        data.galleryUrls ?? [],
        data.amenities ?? [],
        data.capacity ?? 1,
      ],
    );
    return new RoomType(result.rows[0]);
  }

  async update(id: number, data: UpdateRoomTypeDto, client?: PoolClient): Promise<RoomType | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let p = 1;

    const add = (col: string, val: any) => {
      updates.push(`${col} = $${p++}`);
      values.push(val);
    };

    if (data.name !== undefined) add('name', data.name);
    if (data.description !== undefined) add('description', data.description);
    if (data.galleryUrls !== undefined) add('gallery_urls', data.galleryUrls);
    if (data.amenities !== undefined) add('amenities', data.amenities);
    if (data.capacity !== undefined) add('capacity', data.capacity);

    if (updates.length === 0) return this.findById(id, client);

    values.push(id);
    const result = await this.getClient(client).query<RoomType>(
      `UPDATE room_types
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${p}
       RETURNING ${this.selectColumns}`,
      values,
    );
    return result.rows[0] ? new RoomType(result.rows[0]) : null;
  }

  async delete(id: number, client?: PoolClient): Promise<boolean> {
    const result = await this.getClient(client).query(`DELETE FROM room_types WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
