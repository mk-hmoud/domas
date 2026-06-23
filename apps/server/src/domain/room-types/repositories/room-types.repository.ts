import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { StorageService } from '../../../common/storage/storage.service';
import { RoomType } from '../entities/room-type.entity';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../dto/room-type.dto';

@Injectable()
export class RoomTypesRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
  ) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  private get selectColumns(): string {
    return `
      id,
      name,
      name_tr       AS "nameTr",
      description,
      description_tr AS "descriptionTr",
      gallery_urls  AS "galleryUrls",
      amenities,
      capacity,
      created_at    AS "createdAt",
      updated_at    AS "updatedAt"
    `;
  }

  private async mapRow(row: any): Promise<RoomType> {
    const keys: string[] = row.galleryUrls ?? [];
    const galleryUrls = keys.length
      ? await Promise.all(keys.map((k) => this.storage.presign(k)))
      : [];
    return new RoomType({ ...row, galleryUrls });
  }

  async findAll(client?: PoolClient): Promise<RoomType[]> {
    const result = await this.getClient(client).query<RoomType>(
      `SELECT ${this.selectColumns} FROM room_types ORDER BY name`,
    );
    return Promise.all(result.rows.map((r) => this.mapRow(r)));
  }

  async findById(id: number, client?: PoolClient): Promise<RoomType | null> {
    const result = await this.getClient(client).query<RoomType>(
      `SELECT ${this.selectColumns} FROM room_types WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  // Returns raw storage keys (not pre-signed) — for internal use only
  async findByIdRaw(id: number, client?: PoolClient): Promise<RoomType | null> {
    const result = await this.getClient(client).query<RoomType>(
      `SELECT ${this.selectColumns} FROM room_types WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? new RoomType(result.rows[0]) : null;
  }

  async create(data: CreateRoomTypeDto, client?: PoolClient): Promise<RoomType> {
    const result = await this.getClient(client).query<RoomType>(
      `INSERT INTO room_types (name, name_tr, description, description_tr, gallery_urls, amenities, capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${this.selectColumns}`,
      [
        data.name,
        data.nameTr ?? null,
        data.description ?? null,
        data.descriptionTr ?? null,
        data.galleryUrls ?? [],
        data.amenities ?? [],
        data.capacity,
      ],
    );
    return this.mapRow(result.rows[0]);
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
    if ('nameTr' in data) add('name_tr', data.nameTr ?? null);
    if (data.description !== undefined) add('description', data.description);
    if ('descriptionTr' in data) add('description_tr', data.descriptionTr ?? null);
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
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async appendImageKey(id: number, key: string, client?: PoolClient): Promise<RoomType> {
    const result = await this.getClient(client).query<RoomType>(
      `UPDATE room_types
       SET gallery_urls = gallery_urls || $2::text, updated_at = NOW()
       WHERE id = $1
       RETURNING ${this.selectColumns}`,
      [id, key],
    );
    return this.mapRow(result.rows[0]);
  }

  async removeImageAtIndex(id: number, index: number, client?: PoolClient): Promise<RoomType> {
    // PostgreSQL arrays are 1-based; index arrives as 0-based from JS
    const result = await this.getClient(client).query<RoomType>(
      `UPDATE room_types
       SET gallery_urls = (
         SELECT COALESCE(array_agg(elem ORDER BY ord), '{}')
         FROM unnest(gallery_urls) WITH ORDINALITY AS t(elem, ord)
         WHERE ord != $2
       ),
       updated_at = NOW()
       WHERE id = $1
       RETURNING ${this.selectColumns}`,
      [id, index + 1],
    );
    return this.mapRow(result.rows[0]);
  }

  async delete(id: number, client?: PoolClient): Promise<boolean> {
    const result = await this.getClient(client).query(`DELETE FROM room_types WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
