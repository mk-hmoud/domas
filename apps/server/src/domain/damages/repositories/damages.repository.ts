import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { DamageReport } from '../entities/damage-report.entity';
import { DamageLiability } from '../entities/damage-liability.entity';
import { CreateDamageReportDto } from '../dto/create-damage-report.dto';
import { DamageStatus } from '@domas/ts-types';

@Injectable()
export class DamagesRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  async createReport(
    data: CreateDamageReportDto & { reportedBy: string },
    client?: PoolClient,
  ): Promise<DamageReport> {
    const query = `
      INSERT INTO damage_reports (
        location_id, snapshot_id, manual_cost_try, manual_cost_foreign, manual_currency_code, description, reported_by, culprit_ids, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING id, location_id as "locationId", snapshot_id as "snapshotId",
                manual_cost_try as "manualCostTry", manual_cost_foreign as "manualCostForeign",
                manual_currency_code as "manualCurrencyCode",
                description, status, reported_by as "reportedBy", reported_at as "reportedAt",
                culprit_ids as "culpritIds", created_at as "createdAt", updated_at as "updatedAt"
    `;
    const values = [
      data.locationId,
      data.snapshotId || null,
      data.manualCostTry || null,
      data.manualCostForeign || null,
      data.manualCurrencyCode || 'EUR',
      data.description,
      data.reportedBy,
      data.culpritIds || null,
    ];

    const result = await this.getClient(client).query(query, values);
    return new DamageReport(result.rows[0]);
  }

  async createLiability(
    data: {
      damageReportId: string;
      studentId: string;
      amount: number;
      currency: string;
    },
    client?: PoolClient,
  ): Promise<DamageLiability> {
    const query = `
      INSERT INTO damage_liabilities (damage_report_id, student_id, amount, currency)
      VALUES ($1, $2, $3, $4)
      RETURNING id, damage_report_id as "damageReportId", student_id as "studentId",
                amount, currency, transaction_id as "transactionId",
                created_at as "createdAt", updated_at as "updatedAt"
    `;
    const values = [data.damageReportId, data.studentId, data.amount, data.currency];

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

  async findReportById(id: string, client?: PoolClient): Promise<DamageReport | null> {
    const query = `
      SELECT dr.id, dr.location_id as "locationId", dr.snapshot_id as "snapshotId",
             dr.manual_cost_try as "manualCostTry", dr.manual_cost_foreign as "manualCostForeign",
             dr.manual_currency_code as "manualCurrencyCode",
             dr.description, dr.status,
             dr.reported_by as "reportedBy", dr.reported_at as "reportedAt",
             dr.reviewed_by as "reviewedBy", dr.reviewed_at as "reviewedAt",
             dr.culprit_ids as "culpritIds",
             dr.created_at as "createdAt", dr.updated_at as "updatedAt",
             l.name as "locationName"
      FROM damage_reports dr
      JOIN locations l ON dr.location_id = l.id
      WHERE dr.id = $1
    `;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ? new DamageReport(result.rows[0]) : null;
  }

  async findAllReports(
    filters: { status?: DamageStatus; locationId?: number } = {},
  ): Promise<any[]> {
    let query = `
      SELECT dr.id, dr.location_id as "locationId", dr.snapshot_id as "snapshotId",
             dr.manual_cost_try as "manualCostTry", dr.manual_cost_foreign as "manualCostForeign",
             dr.manual_currency_code as "manualCurrencyCode",
             dr.description, dr.status,
             dr.reported_by as "reportedBy", dr.reported_at as "reportedAt",
             dr.reviewed_by as "reviewedBy", dr.reviewed_at as "reviewedAt",
             dr.culprit_ids as "culpritIds",
             dr.created_at as "createdAt", dr.updated_at as "updatedAt",
             l.name as "locationName",
             u.first_name || ' ' || u.last_name as "reportedByName"
      FROM damage_reports dr
      JOIN locations l ON dr.location_id = l.id
      JOIN users u ON dr.reported_by = u.id
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
      SELECT id, damage_report_id as "damageReportId", student_id as "studentId",
             amount, currency, transaction_id as "transactionId",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM damage_liabilities
      WHERE damage_report_id = $1
    `;
    const result = await this.db.query(query, [reportId]);
    return result.rows.map((r) => new DamageLiability(r));
  }
}
