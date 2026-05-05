import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { CardBatch } from '../entities/card-batch.entity';
import { AccessCard } from '../entities/access-card.entity';
import { AccessCardLog } from '../entities/access-card-log.entity';
import { CreateCardBatchDto } from '../dto/create-card-batch.dto';
import { CardStatus } from '../../../common/enums/card-status.enum';
import { CardActionType } from '../../../common/enums/card-action-type.enum';

const CARD_COLUMNS = `
  id, batch_id as "batchId", card_number as "cardNumber", status,
  current_holder_id as "currentHolderId", current_booking_id as "currentBookingId",
  snapshot_id as "snapshotId",
  issued_at as "issuedAt", issued_by as "issuedBy", returned_at as "returnedAt",
  created_at as "createdAt", updated_at as "updatedAt"
`;

const BATCH_COLUMNS = `
  id, location_id as "locationId", catalog_id as "catalogId", name,
  range_start as "rangeStart", range_end as "rangeEnd",
  created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
`;

@Injectable()
export class AccessCardsRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  // --- Batches ---

  async createBatch(
    data: CreateCardBatchDto & { createdBy: string; name?: string },
    client?: PoolClient,
  ): Promise<CardBatch> {
    const query = `
      INSERT INTO card_batches (location_id, catalog_id, name, range_start, range_end, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${BATCH_COLUMNS}
    `;
    const values = [
      data.locationId || null,
      data.catalogId || null,
      data.name || null,
      data.rangeStart,
      data.rangeEnd,
      data.createdBy,
    ];

    const result = await this.getClient(client).query(query, values);
    return new CardBatch(result.rows[0]);
  }

  async findAllBatches(): Promise<CardBatch[]> {
    const result = await this.db.query(
      `SELECT ${BATCH_COLUMNS} FROM card_batches ORDER BY created_at DESC`,
    );
    return result.rows.map((r) => new CardBatch(r));
  }

  async findBatchById(id: number, client?: PoolClient): Promise<CardBatch | null> {
    const result = await this.getClient(client).query(
      `SELECT ${BATCH_COLUMNS} FROM card_batches WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? new CardBatch(result.rows[0]) : null;
  }

  // --- Cards ---

  async createCardsInBatch(
    batchId: number,
    start: number,
    end: number,
    client?: PoolClient,
  ): Promise<void> {
    const query = `
      INSERT INTO access_cards (batch_id, card_number, status)
      SELECT $1, generate_series($2::INTEGER, $3::INTEGER), 'available'
      ON CONFLICT (card_number) DO NOTHING
    `;
    await this.getClient(client).query(query, [batchId, start, end]);
  }

  async assignRandomCard(
    studentId: string,
    bookingId: string,
    issuerId: string,
    batchId?: number,
    client?: PoolClient,
  ): Promise<AccessCard | null> {
    const query = `
      UPDATE access_cards
      SET status = 'active',
          current_holder_id = $1,
          current_booking_id = $2,
          issued_at = NOW(),
          issued_by = $3,
          updated_at = NOW()
      WHERE id = (
          SELECT id FROM access_cards
          WHERE status = 'available'
          ${batchId ? 'AND batch_id = $4' : ''}
          ORDER BY random()
          LIMIT 1
          FOR UPDATE SKIP LOCKED
      )
      RETURNING ${CARD_COLUMNS}
    `;

    const params = batchId
      ? [studentId, bookingId, issuerId, batchId]
      : [studentId, bookingId, issuerId];

    const result = await this.getClient(client).query(query, params);
    return result.rows[0] ? new AccessCard(result.rows[0]) : null;
  }

  async issueSpecificCard(
    cardNumber: number,
    studentId: string,
    bookingId: string,
    issuerId: string,
    client?: PoolClient,
  ): Promise<AccessCard | null> {
    const query = `
      UPDATE access_cards
      SET status = 'active',
          current_holder_id = $1,
          current_booking_id = $2,
          issued_at = NOW(),
          issued_by = $3,
          updated_at = NOW()
      WHERE card_number = $4
        AND status = 'available'
      RETURNING ${CARD_COLUMNS}
    `;

    const result = await this.getClient(client).query(query, [
      studentId,
      bookingId,
      issuerId,
      cardNumber,
    ]);
    return result.rows[0] ? new AccessCard(result.rows[0]) : null;
  }

  async createCardSnapshot(
    cardId: number,
    bookingId: string,
    catalogId: number,
    issuerId: string,
    client: PoolClient,
  ): Promise<void> {
    const catalogRes = await client.query(
      `SELECT name_tr, name_en, description_tr, description_en, scope
       FROM inventory_catalog WHERE id = $1 AND deleted_at IS NULL`,
      [catalogId],
    );
    if (!catalogRes.rows[0]) return;

    const item = catalogRes.rows[0];
    const snapshotRes = await client.query(
      `INSERT INTO booking_inventory_snapshots
         (booking_id, catalog_id, name_tr, name_en, description_tr, description_en,
          scope, quantity, checkin_recorded_at, checkin_recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), $8)
       RETURNING id`,
      [
        bookingId,
        catalogId,
        item.name_tr,
        item.name_en,
        item.description_tr,
        item.description_en,
        item.scope,
        issuerId,
      ],
    );

    await client.query(`UPDATE access_cards SET snapshot_id = $1 WHERE id = $2`, [
      snapshotRes.rows[0].id,
      cardId,
    ]);
  }

  async findAvailableCard(batchId?: number, client?: PoolClient): Promise<AccessCard | null> {
    let query = `SELECT ${CARD_COLUMNS} FROM access_cards WHERE status = 'available'`;
    const values: any[] = [];

    if (batchId) {
      query += ` AND batch_id = $1`;
      values.push(batchId);
    }

    query += ` LIMIT 1`;
    const result = await this.getClient(client).query(query, values);
    return result.rows[0] ? new AccessCard(result.rows[0]) : null;
  }

  async findByCardNumber(cardNumber: number, client?: PoolClient): Promise<AccessCard | null> {
    const result = await this.getClient(client).query(
      `SELECT ${CARD_COLUMNS} FROM access_cards WHERE card_number = $1`,
      [cardNumber],
    );
    return result.rows[0] ? new AccessCard(result.rows[0]) : null;
  }

  async findById(id: number, client?: PoolClient): Promise<AccessCard | null> {
    const result = await this.getClient(client).query(
      `SELECT ${CARD_COLUMNS} FROM access_cards WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? new AccessCard(result.rows[0]) : null;
  }

  async findAllCards(
    filters: { batchId?: number; status?: CardStatus } = {},
  ): Promise<AccessCard[]> {
    let query = `SELECT ${CARD_COLUMNS} FROM access_cards WHERE 1=1`;
    const values: any[] = [];

    if (filters.batchId) {
      values.push(filters.batchId);
      query += ` AND batch_id = $${values.length}`;
    }

    if (filters.status) {
      values.push(filters.status);
      query += ` AND status = $${values.length}`;
    }

    query += ` ORDER BY card_number ASC`;
    const result = await this.db.query(query, values);
    return result.rows.map((r) => new AccessCard(r));
  }

  async updateCard(
    id: number,
    data: Partial<AccessCard>,
    client?: PoolClient,
  ): Promise<AccessCard | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const mapping: Record<string, string> = {
      status: 'status',
      currentHolderId: 'current_holder_id',
      currentBookingId: 'current_booking_id',
      snapshotId: 'snapshot_id',
      issuedAt: 'issued_at',
      issuedBy: 'issued_by',
      returnedAt: 'returned_at',
    };

    for (const [key, column] of Object.entries(mapping)) {
      if (data[key as keyof AccessCard] !== undefined) {
        updates.push(`${column} = $${paramIndex++}`);
        values.push(data[key as keyof AccessCard]);
      }
    }

    if (updates.length === 0) return this.findById(id, client);

    values.push(id);
    const query = `
      UPDATE access_cards
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING ${CARD_COLUMNS}
    `;

    const result = await this.getClient(client).query(query, values);
    return result.rows[0] ? new AccessCard(result.rows[0]) : null;
  }

  // --- Logs ---

  async createLog(
    data: {
      cardId: number;
      studentId?: string;
      bookingId?: string;
      actionType: CardActionType;
      performedBy: string;
      notes?: string;
    },
    client?: PoolClient,
  ): Promise<void> {
    const query = `
      INSERT INTO access_card_logs (card_id, student_id, booking_id, action_type, performed_by, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await this.getClient(client).query(query, [
      data.cardId,
      data.studentId || null,
      data.bookingId || null,
      data.actionType,
      data.performedBy,
      data.notes || null,
    ]);
  }

  async findLogsByCard(cardId: number): Promise<AccessCardLog[]> {
    const query = `
      SELECT id, card_id as "cardId", student_id as "studentId", booking_id as "bookingId",
             action_type as "actionType", performed_by as "performedBy",
             performed_at as "performedAt", notes
      FROM access_card_logs
      WHERE card_id = $1
      ORDER BY performed_at DESC
    `;
    const result = await this.db.query(query, [cardId]);
    return result.rows.map((r) => new AccessCardLog(r));
  }
}
