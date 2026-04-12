import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { DashboardStats } from '@domas/ts-types';
import { PERMISSIONS } from '../../../common/constants/permissions';

@Injectable()
export class StatsService {
  constructor(private readonly db: DatabaseService) {}

  async getDashboard(permissions: string[]): Promise<DashboardStats> {
    const has = (p: string) => permissions?.includes(p) || permissions?.includes('*');

    const pool = this.db.getPool();
    const result: DashboardStats = {};

    const queries: Promise<void>[] = [];

    if (has(PERMISSIONS.BOOKINGS_VIEW)) {
      queries.push(
        pool
          .query(
            `
            SELECT
              COUNT(*) FILTER (WHERE status = 'pending_accounting') AS pending_approval,
              COUNT(*) FILTER (WHERE status = 'active') AS active_residents,
              COUNT(*) FILTER (
                WHERE status = 'ready_for_checkin'
                  AND start_date = CURRENT_DATE
              ) AS check_ins_today,
              COUNT(*) FILTER (
                WHERE status = 'active'
                  AND end_date = CURRENT_DATE
              ) AS check_outs_today
            FROM bookings
            WHERE status NOT IN ('cancelled', 'rejected', 'draft')
          `,
          )
          .then((r) => {
            const row = r.rows[0];
            result.bookings = {
              pendingApproval: parseInt(row.pending_approval, 10),
              activeResidents: parseInt(row.active_residents, 10),
              checkInsToday: parseInt(row.check_ins_today, 10),
              checkOutsToday: parseInt(row.check_outs_today, 10),
            };
          }),
      );
    }

    if (has(PERMISSIONS.DAMAGES_VIEW)) {
      queries.push(
        pool
          .query(
            `
            SELECT COUNT(*) AS pending_reports
            FROM damage_reports
            WHERE status = 'pending'
          `,
          )
          .then((r) => {
            result.damages = {
              pendingReports: parseInt(r.rows[0].pending_reports, 10),
            };
          }),
      );
    }

    if (has(PERMISSIONS.GUESTS_MANAGE)) {
      queries.push(
        pool
          .query(
            `
            SELECT
              COUNT(*) FILTER (WHERE status = 'active') AS active_stays,
              COUNT(*) FILTER (
                WHERE status = 'confirmed'
                  AND check_in_date = CURRENT_DATE
              ) AS check_ins_today
            FROM guest_stays
          `,
          )
          .then((r) => {
            const row = r.rows[0];
            result.guests = {
              activeStays: parseInt(row.active_stays, 10),
              checkInsToday: parseInt(row.check_ins_today, 10),
            };
          }),
      );
    }

    if (has(PERMISSIONS.STUDENTS_VIEW)) {
      queries.push(
        pool
          .query(
            `
            SELECT
              (SELECT COUNT(*) FROM students) AS total,
              (
                SELECT COUNT(*)
                FROM students s
                WHERE NOT EXISTS (
                  SELECT 1 FROM bookings b
                  WHERE b.student_id = s.id
                    AND b.status IN ('active', 'ready_for_checkin', 'pending_accounting', 'confirmed')
                )
              ) AS without_active_booking
          `,
          )
          .then((r) => {
            const row = r.rows[0];
            result.students = {
              total: parseInt(row.total, 10),
              withoutActiveBooking: parseInt(row.without_active_booking, 10),
            };
          }),
      );
    }

    if (has(PERMISSIONS.BOOKINGS_APPROVE_FINANCIAL)) {
      queries.push(
        pool
          .query(
            `
            SELECT
              COUNT(*) FILTER (WHERE payment_status = 'pending') AS pending_payments,
              COUNT(*) FILTER (
                WHERE payment_status = 'pending'
                  AND end_date < CURRENT_DATE
              ) AS overdue_count
            FROM bookings
            WHERE status NOT IN ('cancelled', 'rejected', 'draft')
          `,
          )
          .then((r) => {
            const row = r.rows[0];
            result.finances = {
              pendingPayments: parseInt(row.pending_payments, 10),
              overdueCount: parseInt(row.overdue_count, 10),
            };
          }),
      );
    }

    await Promise.all(queries);
    return result;
  }
}
