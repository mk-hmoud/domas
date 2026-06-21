import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { DashboardStats } from '@domas/ts-types';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { LocationScope } from '../../../common/interfaces/location-scope.interface';

@Injectable()
export class StatsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly locationScopeService: LocationScopeService,
  ) {}

  async getDashboard(
    permissions: string[],
    isRecoveryAdmin?: boolean,
    locationScope?: LocationScope,
  ): Promise<DashboardStats> {
    const has = (p: string) =>
      isRecoveryAdmin || permissions?.includes(p) || permissions?.includes('*');

    const pool = this.db.getPool();
    const result: DashboardStats = {};

    const queries: Promise<void>[] = [];

    if (has(PERMISSIONS.BOOKINGS_VIEW)) {
      const bookingsScope = this.locationScopeService.buildScopeClause(
        locationScope,
        'l.tree_path',
        1,
      );

      queries.push(
        pool
          .query(
            `
            SELECT
              COUNT(*) FILTER (WHERE b.status = 'pending_accounting') AS pending_approval,
              COUNT(*) FILTER (WHERE b.status = 'active') AS active_residents,
              COUNT(*) FILTER (
                WHERE b.status = 'ready_for_checkin'
                  AND b.start_date = CURRENT_DATE
              ) AS check_ins_today,
              COUNT(*) FILTER (
                WHERE b.status = 'active'
                  AND b.end_date = CURRENT_DATE
              ) AS check_outs_today
            FROM bookings b
            JOIN beds bd ON bd.id = b.bed_id
            JOIN locations l ON l.id = bd.location_id
            WHERE b.status NOT IN ('cancelled', 'rejected', 'draft')
              AND ${bookingsScope.clause}
          `,
            bookingsScope.param ? [bookingsScope.param] : [],
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

      const pendingBookingsScope = this.locationScopeService.buildScopeClause(
        locationScope,
        'l.tree_path',
        1,
      );

      queries.push(
        pool
          .query(
            `
            SELECT
              b.id,
              s.first_name || ' ' || s.last_name AS student_name,
              s.student_number,
              l.name AS location_name,
              b.start_date,
              b.end_date
            FROM bookings b
            JOIN students s ON s.id = b.student_id
            JOIN beds bd ON bd.id = b.bed_id
            JOIN locations l ON l.id = bd.location_id
            WHERE b.status = 'pending_accounting'
              AND ${pendingBookingsScope.clause}
            ORDER BY b.created_at ASC
            LIMIT 5
          `,
            pendingBookingsScope.param ? [pendingBookingsScope.param] : [],
          )
          .then((r) => {
            result.pendingBookings = r.rows.map((row) => ({
              id: row.id,
              studentName: row.student_name,
              studentNumber: row.student_number,
              locationPath: row.location_name,
              startDate: row.start_date,
              endDate: row.end_date,
            }));
          }),
      );
    }

    if (has(PERMISSIONS.DAMAGES_VIEW)) {
      const damagesScope = this.locationScopeService.buildScopeClause(
        locationScope,
        'l.tree_path',
        1,
      );

      queries.push(
        pool
          .query(
            `
            SELECT COUNT(*) AS pending_reports
            FROM damage_reports dr
            JOIN locations l ON l.id = dr.location_id
            WHERE dr.status = 'pending'
              AND ${damagesScope.clause}
          `,
            damagesScope.param ? [damagesScope.param] : [],
          )
          .then((r) => {
            result.damages = {
              pendingReports: parseInt(r.rows[0].pending_reports, 10),
            };
          }),
      );

      const pendingDamagesScope = this.locationScopeService.buildScopeClause(
        locationScope,
        'l.tree_path',
        1,
      );

      queries.push(
        pool
          .query(
            `
            SELECT
              dr.id,
              l.name AS location_name,
              dr.description,
              dr.reported_at
            FROM damage_reports dr
            JOIN locations l ON l.id = dr.location_id
            WHERE dr.status = 'pending'
              AND ${pendingDamagesScope.clause}
            ORDER BY dr.reported_at ASC
            LIMIT 5
          `,
            pendingDamagesScope.param ? [pendingDamagesScope.param] : [],
          )
          .then((r) => {
            result.pendingDamages = r.rows.map((row) => ({
              id: row.id,
              locationName: row.location_name,
              description: row.description,
              reportedAt: row.reported_at,
            }));
          }),
      );
    }

    if (has(PERMISSIONS.GUESTS_MANAGE)) {
      const guestsScope = this.locationScopeService.buildScopeClause(
        locationScope,
        'l.tree_path',
        1,
      );

      queries.push(
        pool
          .query(
            `
            SELECT
              COUNT(*) FILTER (WHERE gs.status = 'active') AS active_stays,
              COUNT(*) FILTER (
                WHERE gs.status = 'confirmed'
                  AND gs.check_in_date = CURRENT_DATE
              ) AS check_ins_today
            FROM guest_stays gs
            JOIN beds bd ON bd.id = gs.bed_id
            JOIN locations l ON l.id = bd.location_id
            WHERE ${guestsScope.clause}
          `,
            guestsScope.param ? [guestsScope.param] : [],
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

    // Students total / without-active-booking / pending-applications are
    // global counts, not tied to a single location (applicants and students
    // without a booking aren't "under" any location yet) - left unscoped.
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
              ) AS without_active_booking,
              (SELECT COUNT(*) FROM student_applications WHERE status = 'pending') AS pending_applications
          `,
          )
          .then((r) => {
            const row = r.rows[0];
            result.students = {
              total: parseInt(row.total, 10),
              withoutActiveBooking: parseInt(row.without_active_booking, 10),
              pendingApplications: parseInt(row.pending_applications, 10),
            };
          }),
      );
    }

    if (has(PERMISSIONS.BOOKINGS_APPROVE_FINANCIAL)) {
      const financesScope = this.locationScopeService.buildScopeClause(
        locationScope,
        'l.tree_path',
        1,
      );

      queries.push(
        pool
          .query(
            `
            SELECT
              COUNT(*) FILTER (WHERE b.payment_status = 'pending') AS pending_payments,
              COUNT(*) FILTER (
                WHERE b.payment_status = 'pending'
                  AND b.end_date < CURRENT_DATE
              ) AS overdue_count,
              COUNT(*) FILTER (WHERE b.status = 'pending_accounting') AS pending_accounting
            FROM bookings b
            JOIN beds bd ON bd.id = b.bed_id
            JOIN locations l ON l.id = bd.location_id
            WHERE b.status NOT IN ('cancelled', 'rejected', 'draft')
              AND ${financesScope.clause}
          `,
            financesScope.param ? [financesScope.param] : [],
          )
          .then((r) => {
            const row = r.rows[0];
            result.finances = {
              pendingPayments: parseInt(row.pending_payments, 10),
              overdueCount: parseInt(row.overdue_count, 10),
              pendingAccounting: parseInt(row.pending_accounting, 10),
            };
          }),
      );
    }

    if (has(PERMISSIONS.ROOM_CHANGES_VIEW)) {
      const roomChangesScope = this.locationScopeService.buildScopeClause(
        locationScope,
        'l.tree_path',
        1,
      );

      queries.push(
        pool
          .query(
            `
            SELECT COUNT(*) AS pending_count
            FROM room_change_requests rcr
            JOIN bookings b ON b.id = rcr.booking_id
            JOIN beds bd ON bd.id = b.bed_id
            JOIN locations l ON l.id = bd.location_id
            WHERE rcr.status = 'pending'
              AND ${roomChangesScope.clause}
          `,
            roomChangesScope.param ? [roomChangesScope.param] : [],
          )
          .then((r) => {
            result.roomChanges = {
              pendingCount: parseInt(r.rows[0].pending_count, 10),
            };
          }),
      );
    }

    await Promise.all(queries);
    return result;
  }
}
