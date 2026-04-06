import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { GenderType } from '../../../common/enums/gender-type.enum';

@Injectable()
export class StudentPortalRepository {
  constructor(private readonly db: DatabaseService) {}

  // ─── Semesters ───────────────────────────────────────────────────────────────

  async findBookableSemesters(): Promise<any[]> {
    const query = `
      SELECT
        id,
        type,
        academic_year       AS "academicYear",
        display_name        AS "displayName",
        start_date          AS "startDate",
        end_date            AS "endDate",
        booking_start_date  AS "bookingStartDate",
        booking_end_date    AS "bookingEndDate",
        deposit_amount_try::numeric    AS "depositAmountTry",
        deposit_amount_foreign::numeric AS "depositAmountForeign",
        foreign_currency_code          AS "foreignCurrencyCode",
        payment_deadline_date          AS "paymentDeadlineDate",
        status
      FROM semesters
      WHERE status IN ('open', 'active')
      ORDER BY start_date DESC
    `;
    const result = await this.db.getPool().query(query);
    return result.rows;
  }

  async findSemesterById(id: number): Promise<any | null> {
    const query = `
      SELECT
        id,
        type,
        academic_year       AS "academicYear",
        display_name        AS "displayName",
        start_date          AS "startDate",
        end_date            AS "endDate",
        booking_start_date  AS "bookingStartDate",
        booking_end_date    AS "bookingEndDate",
        deposit_amount_try::numeric    AS "depositAmountTry",
        deposit_amount_foreign::numeric AS "depositAmountForeign",
        foreign_currency_code          AS "foreignCurrencyCode",
        payment_deadline_date          AS "paymentDeadlineDate",
        status
      FROM semesters
      WHERE id = $1
    `;
    const result = await this.db.getPool().query(query, [id]);
    return result.rows[0] ?? null;
  }

  // ─── Available Beds ───────────────────────────────────────────────────────────

  /**
   * Returns beds that are physically available for the given semester,
   * pre-filtered by the student's nationality and gender constraints.
   */
  async findAvailableBedsForSemester(
    semesterId: number,
    nationalityCode: string,
    gender: GenderType,
  ): Promise<any[]> {
    const isTr = nationalityCode === 'TR';

    const query = `
      SELECT
        b.id,
        b.label,
        b.status,
        b.is_tr_only        AS "isTrOnly",
        b.is_foreigner_only AS "isForeignerOnly",
        b.ownership,
        l.id                AS "roomId",
        l.name              AS "roomName",
        l.gender_lock       AS "genderLock",
        l.base_price::numeric AS "basePrice",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> l.tree_path
          AND    anc.deleted_at IS NULL
        ) AS "locationPath"
      FROM  beds b
      JOIN  locations l ON b.location_id = l.id
      WHERE b.deleted_at IS NULL
        AND b.status = 'available'
        -- no guest zones, no rectorate
        AND b.is_guest_zone = FALSE
        AND l.is_guest_zone = FALSE
        AND b.ownership   != 'rectorate'
        AND l.ownership   != 'rectorate'
        -- gender lock: room must match student gender or be unlocked
        AND (l.gender_lock IS NULL OR l.gender_lock = $1)
        -- TR-only / foreigner-only at both bed and room level
        AND NOT (b.is_tr_only      = TRUE AND $2 = FALSE)
        AND NOT (b.is_foreigner_only = TRUE AND $2 = TRUE)
        AND NOT (l.is_tr_only      = TRUE AND $2 = FALSE)
        AND NOT (l.is_foreigner_only = TRUE AND $2 = TRUE)
        -- not already reserved for this semester
        AND b.id NOT IN (
          SELECT bed_id
          FROM   bookings
          WHERE  semester_id = $3
            AND  status NOT IN ('cancelled', 'rejected')
        )
      ORDER BY l.name, b.label
    `;
    const result = await this.db.getPool().query(query, [gender, isTr, semesterId]);
    return result.rows;
  }

  // ─── Bookings ─────────────────────────────────────────────────────────────────

  async findBookingsByStudent(studentId: string): Promise<any[]> {
    const query = `
      SELECT
        bk.id,
        bk.student_id       AS "studentId",
        bk.bed_id           AS "bedId",
        bk.semester_id      AS "semesterId",
        bk.start_date       AS "startDate",
        bk.end_date         AS "endDate",
        bk.status,
        bk.payment_status   AS "paymentStatus",
        bk.is_accounting_approved AS "isAccountingApproved",
        bk.checked_in_at    AS "checkedInAt",
        bk.checked_out_at   AS "checkedOutAt",
        bk.contract_signed  AS "contractSigned",
        bk.created_at       AS "createdAt",
        -- Semester info
        s.display_name      AS "semesterDisplayName",
        s.status            AS "semesterStatus",
        -- Room info
        bd.label            AS "bedLabel",
        l.name              AS "roomName",
        l.id                AS "roomId",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> l.tree_path
          AND    anc.deleted_at IS NULL
        ) AS "locationPath"
      FROM  bookings bk
      JOIN  semesters s  ON bk.semester_id = s.id
      JOIN  beds bd      ON bk.bed_id      = bd.id
      JOIN  locations l  ON bd.location_id = l.id
      WHERE bk.student_id = $1
      ORDER BY bk.created_at DESC
    `;
    const result = await this.db.getPool().query(query, [studentId]);
    return result.rows;
  }

  async findBookingByIdAndStudent(bookingId: string, studentId: string): Promise<any | null> {
    const query = `
      SELECT
        bk.id,
        bk.student_id       AS "studentId",
        bk.bed_id           AS "bedId",
        bk.semester_id      AS "semesterId",
        bk.start_date       AS "startDate",
        bk.end_date         AS "endDate",
        bk.status,
        bk.payment_status   AS "paymentStatus",
        bk.is_accounting_approved AS "isAccountingApproved",
        bk.accounting_approved_at AS "accountingApprovedAt",
        bk.checked_in_at    AS "checkedInAt",
        bk.checked_out_at   AS "checkedOutAt",
        bk.contract_signed  AS "contractSigned",
        bk.contract_url     AS "contractUrl",
        bk.created_at       AS "createdAt",
        bk.updated_at       AS "updatedAt",
        -- Semester info
        s.display_name      AS "semesterDisplayName",
        s.status            AS "semesterStatus",
        s.deposit_amount_try::numeric    AS "depositAmountTry",
        s.deposit_amount_foreign::numeric AS "depositAmountForeign",
        s.foreign_currency_code          AS "foreignCurrencyCode",
        s.payment_deadline_date          AS "paymentDeadlineDate",
        -- Room info
        bd.label            AS "bedLabel",
        l.name              AS "roomName",
        l.id                AS "roomId",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> l.tree_path
          AND    anc.deleted_at IS NULL
        ) AS "locationPath"
      FROM  bookings bk
      JOIN  semesters s  ON bk.semester_id = s.id
      JOIN  beds bd      ON bk.bed_id      = bd.id
      JOIN  locations l  ON bd.location_id = l.id
      WHERE bk.id = $1
        AND bk.student_id = $2
    `;
    const result = await this.db.getPool().query(query, [bookingId, studentId]);
    return result.rows[0] ?? null;
  }

  async findCurrentBookingByStudent(studentId: string): Promise<any | null> {
    const query = `
      SELECT
        bk.id,
        bk.student_id       AS "studentId",
        bk.bed_id           AS "bedId",
        bk.semester_id      AS "semesterId",
        bk.start_date       AS "startDate",
        bk.end_date         AS "endDate",
        bk.status,
        bk.payment_status   AS "paymentStatus",
        bk.is_accounting_approved AS "isAccountingApproved",
        bk.accounting_approved_at AS "accountingApprovedAt",
        bk.checked_in_at    AS "checkedInAt",
        bk.checked_out_at   AS "checkedOutAt",
        bk.contract_signed  AS "contractSigned",
        bk.contract_url     AS "contractUrl",
        bk.created_at       AS "createdAt",
        -- Semester info
        s.display_name      AS "semesterDisplayName",
        s.deposit_amount_try::numeric    AS "depositAmountTry",
        s.deposit_amount_foreign::numeric AS "depositAmountForeign",
        s.foreign_currency_code          AS "foreignCurrencyCode",
        s.payment_deadline_date          AS "paymentDeadlineDate",
        -- Room info
        bd.label            AS "bedLabel",
        l.name              AS "roomName",
        l.id                AS "roomId",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> l.tree_path
          AND    anc.deleted_at IS NULL
        ) AS "locationPath",
        -- Access card
        ac.card_number AS "accessCardNumber",
        ac.status      AS "accessCardStatus"
      FROM  bookings bk
      JOIN  semesters s  ON bk.semester_id = s.id
      JOIN  beds bd      ON bk.bed_id      = bd.id
      JOIN  locations l  ON bd.location_id = l.id
      LEFT JOIN access_cards ac ON ac.current_booking_id = bk.id AND ac.status = 'active'
      WHERE bk.student_id = $1
        AND bk.status NOT IN ('cancelled', 'rejected', 'completed', 'transferred')
      ORDER BY bk.created_at DESC
      LIMIT 1
    `;
    const result = await this.db.getPool().query(query, [studentId]);
    return result.rows[0] ?? null;
  }

  async hasActiveBookingForSemester(studentId: string, semesterId: number): Promise<boolean> {
    const query = `
      SELECT 1 FROM bookings
      WHERE student_id = $1
        AND semester_id = $2
        AND status NOT IN ('cancelled', 'rejected')
      LIMIT 1
    `;
    const result = await this.db.getPool().query(query, [studentId, semesterId]);
    return (result.rowCount ?? 0) > 0;
  }

  async createBooking(
    studentId: string,
    bedId: number,
    semesterId: number,
    startDate: string,
    endDate: string,
    client: PoolClient,
  ): Promise<any> {
    const query = `
      INSERT INTO bookings (student_id, bed_id, semester_id, start_date, end_date, status, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        student_id   AS "studentId",
        bed_id       AS "bedId",
        semester_id  AS "semesterId",
        start_date   AS "startDate",
        end_date     AS "endDate",
        status,
        payment_status AS "paymentStatus",
        created_at   AS "createdAt"
    `;
    const result = await client.query(query, [
      studentId,
      bedId,
      semesterId,
      startDate,
      endDate,
      BookingOpsStatus.PENDING_ACCOUNTING,
      PaymentStatus.PENDING,
    ]);
    return result.rows[0];
  }

  async lockGenderIfNull(
    locationId: number,
    gender: GenderType,
    client: PoolClient,
  ): Promise<void> {
    await client.query(
      `UPDATE locations SET gender_lock = $1 WHERE id = $2 AND gender_lock IS NULL`,
      [gender, locationId],
    );
  }

  async findBedWithRoom(
    bedId: number,
    client: PoolClient,
  ): Promise<{ bed: any; room: any } | null> {
    const query = `
      SELECT
        b.id           AS "bedId",
        b.label,
        b.status,
        b.is_tr_only   AS "isTrOnly",
        b.is_foreigner_only AS "isForeignerOnly",
        b.is_guest_zone AS "isGuestZone",
        b.ownership    AS "bedOwnership",
        l.id           AS "roomId",
        l.gender_lock  AS "genderLock",
        l.is_tr_only   AS "roomIsTrOnly",
        l.is_foreigner_only AS "roomIsForeignerOnly",
        l.is_guest_zone AS "roomIsGuestZone",
        l.ownership    AS "roomOwnership"
      FROM beds b
      JOIN locations l ON b.location_id = l.id
      WHERE b.id = $1 AND b.deleted_at IS NULL
    `;
    const result = await client.query(query, [bedId]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      bed: {
        id: row.bedId,
        label: row.label,
        status: row.status,
        isTrOnly: row.isTrOnly,
        isForeignerOnly: row.isForeignerOnly,
        isGuestZone: row.isGuestZone,
        ownership: row.bedOwnership,
        locationId: row.roomId,
      },
      room: {
        id: row.roomId,
        genderLock: row.genderLock,
        isTrOnly: row.roomIsTrOnly,
        isForeignerOnly: row.roomIsForeignerOnly,
        isGuestZone: row.roomIsGuestZone,
        ownership: row.roomOwnership,
      },
    };
  }

  // ─── Financial ───────────────────────────────────────────────────────────────

  async findTransactionsByStudent(studentId: string): Promise<any[]> {
    const query = `
      SELECT
        t.id,
        t.booking_id        AS "bookingId",
        t.amount,
        t.transaction_type  AS "transactionType",
        t.is_approved       AS "isApproved",
        t.approved_at       AS "approvedAt",
        t.created_at        AS "createdAt",
        s.display_name      AS "semesterDisplayName"
      FROM transactions t
      JOIN bookings bk ON t.booking_id = bk.id
      JOIN semesters s ON bk.semester_id = s.id
      WHERE t.payer_id = $1
      ORDER BY t.created_at DESC
    `;
    const result = await this.db.getPool().query(query, [studentId]);
    return result.rows;
  }

  async findDamageLiabilitiesByStudent(studentId: string): Promise<any[]> {
    const query = `
      SELECT
        dl.id,
        dl.amount,
        dl.currency,
        dl.created_at       AS "createdAt",
        dr.id               AS "reportId",
        dr.description,
        dr.status           AS "reportStatus",
        dr.reported_at      AS "reportedAt"
      FROM damage_liabilities dl
      JOIN damage_reports dr ON dl.damage_report_id = dr.id
      WHERE dl.student_id = $1
      ORDER BY dl.created_at DESC
    `;
    const result = await this.db.getPool().query(query, [studentId]);
    return result.rows;
  }
}
