import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { StorageService } from '../../../common/storage/storage.service';
import { DamageReport } from '../entities/damage-report.entity';
import { DamageLiability } from '../entities/damage-liability.entity';
import { DamageReportImage } from '../entities/damage-report-image.entity';
import { CreateDamageReportDto } from '../dto/create-damage-report.dto';
import { DamageStatus } from '../../../common/enums/damage-status.enum';

@Injectable()
export class DamagesRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
  ) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  async createReport(
    data: CreateDamageReportDto & { reportedBy: string },
    client?: PoolClient,
  ): Promise<DamageReport> {
    const query = `
      INSERT INTO damage_reports (
        location_id, snapshot_id, catalog_id, manual_cost_try, manual_cost_foreign, manual_currency_code,
        description, reported_by, culprit_ids, culprit_guest_stay_ids, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING id, location_id as "locationId", snapshot_id as "snapshotId", catalog_id as "catalogId",
                manual_cost_try as "manualCostTry", manual_cost_foreign as "manualCostForeign",
                manual_currency_code as "manualCurrencyCode",
                description, status, reported_by as "reportedBy", reported_at as "reportedAt",
                culprit_ids as "culpritIds", culprit_guest_stay_ids as "culpritGuestStayIds",
                created_at as "createdAt", updated_at as "updatedAt"
    `;
    const values = [
      data.locationId,
      data.snapshotId || null,
      data.catalogId || null,
      data.manualCostTry || null,
      data.manualCostForeign || null,
      data.manualCurrencyCode || 'EUR',
      data.description,
      data.reportedBy,
      data.culpritIds || null,
      data.culpritGuestStayIds?.length ? data.culpritGuestStayIds : null,
    ];

    const result = await this.getClient(client).query(query, values);
    return new DamageReport(result.rows[0]);
  }

  async createLiability(
    data: (
      | { damageReportId: string; studentId: string; guestStayId?: never }
      | { damageReportId: string; guestStayId: string; studentId?: never }
    ) & { amount: number; currency: string },
    client?: PoolClient,
  ): Promise<DamageLiability> {
    const isGuest = !!data.guestStayId;
    const query = isGuest
      ? `INSERT INTO damage_liabilities (damage_report_id, guest_stay_id, amount, currency)
         VALUES ($1, $2, $3, $4)
         RETURNING id, damage_report_id as "damageReportId", guest_stay_id as "guestStayId",
                   amount, currency, transaction_id as "transactionId",
                   created_at as "createdAt", updated_at as "updatedAt"`
      : `INSERT INTO damage_liabilities (damage_report_id, student_id, amount, currency)
         VALUES ($1, $2, $3, $4)
         RETURNING id, damage_report_id as "damageReportId", student_id as "studentId",
                   amount, currency, transaction_id as "transactionId",
                   created_at as "createdAt", updated_at as "updatedAt"`;

    const values = [
      data.damageReportId,
      isGuest ? data.guestStayId : data.studentId,
      data.amount,
      data.currency,
    ];

    const result = await this.getClient(client).query(query, values);
    return new DamageLiability(result.rows[0]);
  }

  async findActiveBookingsByLocation(locationIds: number[], client?: PoolClient): Promise<any[]> {
    const query = `
      SELECT b.id, b.student_id, b.bed_id, s.nationality_code
      FROM bookings b
      JOIN beds bd ON b.bed_id = bd.id
      JOIN students s ON b.student_id = s.id
      WHERE bd.location_id = ANY($1)
        AND b.status = 'active'
    `;
    const result = await this.getClient(client).query(query, [locationIds]);
    return result.rows;
  }

  async findActiveBookingsByBed(bedId: number, client?: PoolClient): Promise<any[]> {
    const query = `
      SELECT b.id, b.student_id, b.bed_id, s.nationality_code
      FROM bookings b
      JOIN students s ON b.student_id = s.id
      WHERE b.bed_id = $1
        AND b.status = 'active'
    `;
    const result = await this.getClient(client).query(query, [bedId]);
    return result.rows;
  }

  async findReportById(id: string, client?: PoolClient): Promise<any | null> {
    const query = `
      SELECT dr.id, dr.location_id as "locationId", dr.snapshot_id as "snapshotId",
             dr.catalog_id as "catalogId",
             COALESCE(dr.manual_cost_try, cat.base_price_try) as "costTry",
             COALESCE(dr.manual_cost_foreign, cat.base_price_foreign) as "costForeign",
             COALESCE(dr.manual_currency_code, cat.foreign_currency_code) as "currencyCode",
             dr.description, dr.status,
             dr.reported_by as "reportedBy", dr.reported_at as "reportedAt",
             dr.reviewed_by as "reviewedBy", dr.reviewed_at as "reviewedAt",
             dr.culprit_ids as "culpritIds",
             dr.culprit_guest_stay_ids as "culpritGuestStayIds",
             dr.created_at as "createdAt", dr.updated_at as "updatedAt",
             l.name as "locationName",
             u.first_name || ' ' || u.last_name as "reportedByName",
             rev.first_name || ' ' || rev.last_name as "reviewedByName",
             (
               SELECT COALESCE(json_agg(json_build_object(
                 'id', dri.id,
                 'damageReportId', dri.damage_report_id,
                 'filename', dri.filename,
                 'mimeType', dri.mime_type,
                 'size', dri.size,
                 'createdAt', dri.created_at
               ) ORDER BY dri.created_at), '[]'::json)
               FROM damage_report_images dri
               WHERE dri.damage_report_id = dr.id
             ) as images
      FROM damage_reports dr
      JOIN locations l ON dr.location_id = l.id
      JOIN users u ON dr.reported_by = u.id
      LEFT JOIN users rev ON dr.reviewed_by = rev.id
      LEFT JOIN inventory_catalog cat ON dr.catalog_id = cat.id
      WHERE dr.id = $1
    `;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] || null;
  }

  async findAllReports(
    filters: { status?: DamageStatus; locationId?: number } = {},
  ): Promise<any[]> {
    let query = `
      SELECT dr.id, dr.location_id as "locationId", dr.snapshot_id as "snapshotId",
             dr.catalog_id as "catalogId",
             COALESCE(dr.manual_cost_try, cat.base_price_try) as "costTry",
             COALESCE(dr.manual_cost_foreign, cat.base_price_foreign) as "costForeign",
             COALESCE(dr.manual_currency_code, cat.foreign_currency_code) as "currencyCode",
             dr.description, dr.status,
             dr.reported_by as "reportedBy", dr.reported_at as "reportedAt",
             dr.reviewed_by as "reviewedBy", dr.reviewed_at as "reviewedAt",
             dr.culprit_ids as "culpritIds",
             dr.culprit_guest_stay_ids as "culpritGuestStayIds",
             dr.created_at as "createdAt", dr.updated_at as "updatedAt",
             l.name as "locationName",
             u.first_name || ' ' || u.last_name as "reportedByName",
             rev.first_name || ' ' || rev.last_name as "reviewedByName"
      FROM damage_reports dr
      JOIN locations l ON dr.location_id = l.id
      JOIN users u ON dr.reported_by = u.id
      LEFT JOIN users rev ON dr.reviewed_by = rev.id
      LEFT JOIN inventory_catalog cat ON dr.catalog_id = cat.id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (filters.status) {
      values.push(filters.status);
      query += ` AND dr.status = $${values.length}`;
    }

    if (filters.locationId) {
      values.push(filters.locationId);
      query += ` AND dr.location_id = $${values.length}`;
    }

    query += ` ORDER BY dr.reported_at DESC`;

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async updateReportStatus(
    id: string,
    status: DamageStatus,
    reviewedBy: string,
    client?: PoolClient,
  ): Promise<void> {
    const query = `
      UPDATE damage_reports
      SET status = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
      WHERE id = $3
    `;
    await this.getClient(client).query(query, [status, reviewedBy, id]);
  }

  async findLiabilitiesByReport(reportId: string): Promise<DamageLiability[]> {
    const query = `
      SELECT
        dl.id,
        dl.damage_report_id    AS "damageReportId",
        dl.student_id          AS "studentId",
        dl.guest_stay_id       AS "guestStayId",
        dl.amount,
        dl.currency,
        dl.transaction_id      AS "transactionId",
        dl.created_at          AS "createdAt",
        dl.updated_at          AS "updatedAt",
        s.first_name || ' ' || s.last_name AS "studentName",
        g.first_name || ' ' || g.last_name AS "guestName",
        gs.check_in_date       AS "guestStayCheckIn",
        gs.check_out_date      AS "guestStayCheckOut"
      FROM damage_liabilities dl
      LEFT JOIN students s  ON s.id  = dl.student_id
      LEFT JOIN guest_stays gs ON gs.id = dl.guest_stay_id
      LEFT JOIN guests g    ON g.id  = gs.guest_id
      WHERE dl.damage_report_id = $1
    `;
    const result = await this.db.query(query, [reportId]);
    return result.rows.map((r) => new DamageLiability(r));
  }

  // ─── Images ──────────────────────────────────────────────────────────────────

  async insertImages(reportId: string, files: Express.Multer.File[]): Promise<DamageReportImage[]> {
    const inserted: DamageReportImage[] = [];
    for (const file of files) {
      const id = randomUUID();
      const key = `damages/${reportId}/${id}`;
      await this.storage.upload(key, file.buffer, file.mimetype);
      const result = await this.db.getPool().query(
        `INSERT INTO damage_report_images (id, damage_report_id, filename, mime_type, size, storage_key)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, damage_report_id as "damageReportId", filename, mime_type as "mimeType",
                   size, storage_key as "storageKey", created_at as "createdAt"`,
        [id, reportId, file.originalname, file.mimetype, file.size, key],
      );
      inserted.push(new DamageReportImage(result.rows[0]));
    }
    return inserted;
  }

  async findImagesByReport(reportId: string): Promise<DamageReportImage[]> {
    const result = await this.db.getPool().query(
      `SELECT id, damage_report_id as "damageReportId", filename, mime_type as "mimeType",
              size, storage_key as "storageKey", created_at as "createdAt"
       FROM damage_report_images
       WHERE damage_report_id = $1
       ORDER BY created_at`,
      [reportId],
    );
    return result.rows.map((r) => new DamageReportImage(r));
  }

  async findImageById(imageId: string, reportId: string): Promise<DamageReportImage | null> {
    const result = await this.db.getPool().query(
      `SELECT id, damage_report_id as "damageReportId", filename, mime_type as "mimeType",
              size, storage_key as "storageKey", created_at as "createdAt"
       FROM damage_report_images
       WHERE id = $1 AND damage_report_id = $2`,
      [imageId, reportId],
    );
    return result.rows[0] ? new DamageReportImage(result.rows[0]) : null;
  }

  async deleteImage(imageId: string, reportId: string): Promise<boolean> {
    const result = await this.db.getPool().query(
      `SELECT storage_key as "storageKey" FROM damage_report_images
       WHERE id = $1 AND damage_report_id = $2`,
      [imageId, reportId],
    );
    if (!result.rows[0]) return false;
    await this.storage.delete(result.rows[0].storageKey);
    await this.db
      .getPool()
      .query(`DELETE FROM damage_report_images WHERE id = $1 AND damage_report_id = $2`, [
        imageId,
        reportId,
      ]);
    return true;
  }

  async getPresignedUrl(storageKey: string): Promise<string> {
    return this.storage.presign(storageKey);
  }
}
