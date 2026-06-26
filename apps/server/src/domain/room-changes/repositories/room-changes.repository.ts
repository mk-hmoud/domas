import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { LocationScope } from '../../../common/interfaces/location-scope.interface';

@Injectable()
export class RoomChangesRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly locationScopeService: LocationScopeService,
  ) {}

  private getClient(client?: PoolClient) {
    return client || this.db.getPool();
  }

  private get selectColumns(): string {
    return `
      rc.id,
      rc.booking_id               AS "bookingId",
      rc.student_id               AS "studentId",
      rc.semester_id              AS "semesterId",
      rc.requested_bed_id         AS "requestedBedId",
      rc.current_bed_id           AS "currentBedId",
      rc.status,
      rc.note,
      rc.resolved_by              AS "resolvedBy",
      rc.resolved_at              AS "resolvedAt",
      rc.rejection_reason         AS "rejectionReason",
      rc.requires_payment         AS "requiresPayment",
      rc.payment_amount           AS "paymentAmount",
      rc.payment_currency         AS "paymentCurrency",
      rc.is_accounting_approved   AS "isAccountingApproved",
      rc.accounting_approved_by   AS "accountingApprovedBy",
      rc.accounting_approved_at   AS "accountingApprovedAt",
      rc.created_at               AS "createdAt",
      rc.updated_at               AS "updatedAt"
    `;
  }

  async findAll(
    params?: { semesterId?: number; status?: string },
    scope?: LocationScope,
  ): Promise<any[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (params?.semesterId != null) {
      conditions.push(`rc.semester_id = $${i++}`);
      values.push(params.semesterId);
    }
    if (params?.status) {
      conditions.push(`rc.status = $${i++}`);
      values.push(params.status);
    }

    // current_bed_id is always set at creation time (snapshot of the bed the
    // student is leaving), so it's the stable anchor for scoping - unlike
    // requested_bed_id which is nullable for open requests.
    const scopeFilter = this.locationScopeService.buildScopeClause(
      scope,
      'cl.tree_path',
      values.length + 1,
    );
    if (scopeFilter.param) values.push(scopeFilter.param);
    conditions.push(scopeFilter.clause);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        ${this.selectColumns},
        st.first_name || ' ' || st.last_name  AS "studentName",
        st.student_number                      AS "studentNumber",
        st.nationality_code                    AS "studentNationalityCode",
        s.display_name                         AS "semesterDisplayName",
        cb.label                               AS "currentBedLabel",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> cl.tree_path AND anc.deleted_at IS NULL
        )                                      AS "currentLocationPath",
        rb.label                               AS "requestedBedLabel",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> rl.tree_path AND anc.deleted_at IS NULL
        )                                      AS "requestedLocationPath"
      FROM  room_change_requests rc
      JOIN  students   st ON rc.student_id     = st.id
      JOIN  semesters  s  ON rc.semester_id    = s.id
      JOIN  beds       cb ON rc.current_bed_id = cb.id
      JOIN  locations  cl ON cb.location_id    = cl.id
      LEFT JOIN  beds       rb ON rc.requested_bed_id = rb.id
      LEFT JOIN  locations  rl ON rb.location_id    = rl.id
      ${where}
      ORDER BY rc.created_at DESC
    `;
    const result = await this.db.getPool().query(query, values);
    return result.rows;
  }

  async findByStudent(studentId: string): Promise<any[]> {
    const query = `
      SELECT
        rc.id,
        rc.status,
        rc.note,
        rc.rejection_reason       AS "rejectionReason",
        rc.requires_payment       AS "requiresPayment",
        rc.payment_amount         AS "paymentAmount",
        rc.payment_currency       AS "paymentCurrency",
        rc.is_accounting_approved AS "isAccountingApproved",
        rc.created_at             AS "createdAt",
        rc.resolved_at            AS "resolvedAt",
        rb.label                  AS "requestedBedLabel",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> rl.tree_path AND anc.deleted_at IS NULL
        )                         AS "requestedLocationPath"
      FROM  room_change_requests rc
      LEFT JOIN  beds      rb ON rc.requested_bed_id = rb.id
      LEFT JOIN  locations rl ON rb.location_id      = rl.id
      WHERE rc.student_id = $1
      ORDER BY rc.created_at DESC
    `;
    const result = await this.db.getPool().query(query, [studentId]);
    return result.rows;
  }

  async findById(id: string, client?: PoolClient): Promise<any | null> {
    const query = `
      SELECT ${this.selectColumns}, cl.tree_path AS "treePath"
      FROM room_change_requests rc
      JOIN beds      cb ON rc.current_bed_id = cb.id
      JOIN locations cl ON cb.location_id    = cl.id
      WHERE rc.id = $1
    `;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ?? null;
  }

  async findPendingByBooking(bookingId: string, client?: PoolClient): Promise<any | null> {
    const query = `
      SELECT ${this.selectColumns}
      FROM room_change_requests rc
      WHERE rc.booking_id = $1 AND rc.status = 'pending'
      LIMIT 1
    `;
    const result = await this.getClient(client).query(query, [bookingId]);
    return result.rows[0] ?? null;
  }

  async create(
    data: {
      bookingId: string;
      studentId: string;
      semesterId: number;
      requestedBedId?: number | null;
      currentBedId: number;
      note?: string | null;
      requiresPayment?: boolean;
      paymentAmount?: number | null;
      paymentCurrency?: string | null;
    },
    client?: PoolClient,
  ): Promise<any> {
    const query = `
      WITH rc AS (
        INSERT INTO room_change_requests
          (booking_id, student_id, semester_id, requested_bed_id, current_bed_id, note,
           requires_payment, payment_amount, payment_currency)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      )
      SELECT ${this.selectColumns} FROM rc
    `;
    const result = await this.getClient(client).query(query, [
      data.bookingId,
      data.studentId,
      data.semesterId,
      data.requestedBedId,
      data.currentBedId,
      data.note ?? null,
      data.requiresPayment ?? false,
      data.paymentAmount ?? null,
      data.paymentCurrency ?? null,
    ]);
    return result.rows[0];
  }

  async approvePayment(
    id: string,
    data: {
      approved: boolean;
      approvedBy: string;
      rejectionReason?: string | null;
    },
    client?: PoolClient,
  ): Promise<any | null> {
    if (data.approved) {
      // Confirm payment: mark approved, then move the bed and increment counter
      const updateQuery = `
        WITH rc AS (
          UPDATE room_change_requests
          SET
            status                  = 'approved',
            is_accounting_approved  = TRUE,
            accounting_approved_by  = $1,
            accounting_approved_at  = NOW(),
            updated_at              = NOW()
          WHERE id = $2
            AND requires_payment = TRUE
            AND status = 'pending_payment'
          RETURNING *
        )
        SELECT ${this.selectColumns} FROM rc
      `;
      const result = await this.getClient(client).query(updateQuery, [data.approvedBy, id]);
      const row = result.rows[0] ?? null;
      if (row) {
        await this.moveBed(row.bookingId, row.requestedBedId, true, client);
      }
      return row;
    } else {
      // Reject payment → reject the whole request
      const updateQuery = `
        WITH rc AS (
          UPDATE room_change_requests
          SET
            status                  = 'rejected',
            is_accounting_approved  = FALSE,
            accounting_approved_by  = $1,
            accounting_approved_at  = NOW(),
            rejection_reason        = $2,
            updated_at              = NOW()
          WHERE id = $3
            AND requires_payment = TRUE
            AND status = 'pending_payment'
          RETURNING *
        )
        SELECT ${this.selectColumns} FROM rc
      `;
      const result = await this.getClient(client).query(updateQuery, [
        data.approvedBy,
        data.rejectionReason ?? 'Payment not confirmed by accounting',
        id,
      ]);
      return result.rows[0] ?? null;
    }
  }

  async resolve(
    id: string,
    data: {
      approved: boolean;
      requiresPayment: boolean;
      resolvedBy: string;
      rejectionReason?: string | null;
      assignedBedId?: number | null;
    },
    client?: PoolClient,
  ): Promise<any | null> {
    const status = data.approved
      ? data.requiresPayment
        ? 'pending_payment'
        : 'approved'
      : 'rejected';

    const params: any[] = [status, data.resolvedBy, data.rejectionReason ?? null];
    let bedClause = '';
    if (data.assignedBedId != null) {
      params.push(data.assignedBedId);
      bedClause = `, requested_bed_id = $${params.length}`;
    }
    params.push(id);

    const query = `
      WITH rc AS (
        UPDATE room_change_requests
        SET
          status           = $1,
          resolved_by      = $2,
          resolved_at      = NOW(),
          rejection_reason = $3${bedClause},
          updated_at       = NOW()
        WHERE id = $${params.length} AND status = 'pending'
        RETURNING *
      )
      SELECT ${this.selectColumns} FROM rc
    `;
    const result = await this.getClient(client).query(query, params);
    return result.rows[0] ?? null;
  }

  async findBedWithRoom(
    bedId: number,
    client?: PoolClient,
  ): Promise<{ bed: any; room: any } | null> {
    const query = `
      SELECT
        b.id           AS "bedId",
        b.label,
        b.status,
        b.is_tr_only   AS "isTrOnly",
        b.is_foreigner_only AS "isForeignerOnly",
        b.is_guest_zone AS "isGuestZone",
        b.is_rectorate AS "bedIsRectorate",
        l.id           AS "roomId",
        l.room_type_id AS "roomTypeId",
        l.gender_lock  AS "genderLock",
        l.is_tr_only   AS "roomIsTrOnly",
        l.is_foreigner_only AS "roomIsForeignerOnly",
        l.is_guest_zone AS "roomIsGuestZone",
        l.is_rectorate AS "roomIsRectorate",
        l.tree_path    AS "treePath"
      FROM beds b
      JOIN locations l ON b.location_id = l.id
      WHERE b.id = $1 AND b.deleted_at IS NULL
    `;
    const result = await this.getClient(client).query(query, [bedId]);
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
        isRectorate: row.bedIsRectorate,
        locationId: row.roomId,
      },
      room: {
        id: row.roomId,
        roomTypeId: row.roomTypeId,
        genderLock: row.genderLock,
        isTrOnly: row.roomIsTrOnly,
        isForeignerOnly: row.roomIsForeignerOnly,
        isGuestZone: row.roomIsGuestZone,
        isRectorate: row.roomIsRectorate,
        treePath: row.treePath,
      },
    };
  }

  async deleteById(id: string, studentId: string): Promise<boolean> {
    const result = await this.db
      .getPool()
      .query(
        `DELETE FROM room_change_requests WHERE id = $1 AND student_id = $2 AND status = 'pending'`,
        [id, studentId],
      );
    return (result.rowCount ?? 0) > 0;
  }

  // ─── Booking helpers ──────────────────────────────────────────────────────────

  async findActiveBookingForStudent(
    studentId: string,
    semesterId: number,
    client?: PoolClient,
  ): Promise<any | null> {
    const query = `
      SELECT
        bk.id,
        bk.bed_id                       AS "bedId",
        bk.semester_id                  AS "semesterId",
        bk.status,
        bk.room_changes_count           AS "roomChangesCount",
        s.max_room_changes              AS "maxRoomChanges",
        s.paid_room_change_after        AS "paidRoomChangeAfter",
        s.room_change_amount_try        AS "roomChangeAmountTry",
        s.room_change_amount_foreign    AS "roomChangeAmountForeign",
        s.foreign_currency_code         AS "foreignCurrencyCode"
      FROM bookings bk
      JOIN semesters s ON bk.semester_id = s.id
      WHERE bk.student_id = $1
        AND bk.semester_id = $2
        AND bk.status NOT IN ('cancelled', 'rejected', 'completed', 'transferred')
      LIMIT 1
    `;
    const result = await this.getClient(client).query(query, [studentId, semesterId]);
    return result.rows[0] ?? null;
  }

  async isBedTaken(
    bedId: number,
    semesterId: number,
    excludeBookingId?: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const query = `
      SELECT 1 FROM bookings
      WHERE bed_id = $1
        AND semester_id = $2
        AND status NOT IN ('cancelled', 'rejected', 'draft')
        ${excludeBookingId ? 'AND id != $3' : ''}
      LIMIT 1
    `;
    const params: any[] = [bedId, semesterId];
    if (excludeBookingId) params.push(excludeBookingId);
    const result = await this.getClient(client).query(query, params);
    return (result.rowCount ?? 0) > 0;
  }

  async findAvailableBedsForBooking(bookingId: string, scope?: LocationScope): Promise<any[]> {
    const values: any[] = [bookingId];
    const scopeFilter = this.locationScopeService.buildScopeClause(
      scope,
      'l.tree_path',
      values.length + 1,
    );
    if (scopeFilter.param) values.push(scopeFilter.param);

    const query = `
      SELECT
        b.id,
        b.label,
        l.id    AS "roomId",
        l.name  AS "roomName",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> l.tree_path AND anc.deleted_at IS NULL
        ) AS "locationPath"
      FROM  bookings bk
      JOIN  students st ON st.id = bk.student_id
      JOIN  beds b      ON b.deleted_at IS NULL AND b.status = 'available'
      JOIN  locations l ON b.location_id = l.id
      WHERE bk.id = $1
        -- exclude beds already booked in this semester
        AND b.id NOT IN (
          SELECT bed_id FROM bookings
          WHERE  semester_id = bk.semester_id
            AND  status NOT IN ('cancelled', 'rejected')
            AND  id != bk.id
        )
        -- gender compatibility
        AND (l.gender_lock IS NULL OR l.gender_lock = st.gender)
        -- TR/international room compatibility
        AND NOT (l.is_tr_only        = TRUE AND st.nationality_code != 'TR')
        AND NOT (l.is_foreigner_only = TRUE AND st.nationality_code  = 'TR')
        -- TR/international bed compatibility
        AND NOT (b.is_tr_only        = TRUE AND st.nationality_code != 'TR')
        AND NOT (b.is_foreigner_only = TRUE AND st.nationality_code  = 'TR')
        AND ${scopeFilter.clause}
      ORDER BY l.name, b.label
    `;
    const result = await this.db.getPool().query(query, values);
    return result.rows;
  }

  async moveBed(
    bookingId: string,
    newBedId: number,
    incrementCounter: boolean,
    client?: PoolClient,
  ): Promise<void> {
    const counterClause = incrementCounter ? ', room_changes_count = room_changes_count + 1' : '';
    await this.getClient(client).query(
      `UPDATE bookings SET bed_id = $1${counterClause}, updated_at = NOW() WHERE id = $2`,
      [newBedId, bookingId],
    );
  }
}
