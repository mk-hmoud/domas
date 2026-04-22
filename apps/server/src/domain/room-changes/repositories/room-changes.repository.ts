import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';

@Injectable()
export class RoomChangesRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient) {
    return client || this.db.getPool();
  }

  private get selectColumns(): string {
    return `
      rc.id,
      rc.booking_id          AS "bookingId",
      rc.student_id          AS "studentId",
      rc.semester_id         AS "semesterId",
      rc.requested_bed_id    AS "requestedBedId",
      rc.current_bed_id      AS "currentBedId",
      rc.status,
      rc.note,
      rc.resolved_by         AS "resolvedBy",
      rc.resolved_at         AS "resolvedAt",
      rc.rejection_reason    AS "rejectionReason",
      rc.created_at          AS "createdAt",
      rc.updated_at          AS "updatedAt"
    `;
  }

  async findAll(params?: { semesterId?: number; status?: string }): Promise<any[]> {
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

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        ${this.selectColumns},
        st.first_name || ' ' || st.last_name  AS "studentName",
        st.student_number                      AS "studentNumber",
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
      JOIN  beds       rb ON rc.requested_bed_id = rb.id
      JOIN  locations  rl ON rb.location_id    = rl.id
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
        rc.rejection_reason AS "rejectionReason",
        rc.created_at       AS "createdAt",
        rc.resolved_at      AS "resolvedAt",
        rb.label            AS "requestedBedLabel",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> rl.tree_path AND anc.deleted_at IS NULL
        )                   AS "requestedLocationPath"
      FROM  room_change_requests rc
      JOIN  beds      rb ON rc.requested_bed_id = rb.id
      JOIN  locations rl ON rb.location_id      = rl.id
      WHERE rc.student_id = $1
      ORDER BY rc.created_at DESC
    `;
    const result = await this.db.getPool().query(query, [studentId]);
    return result.rows;
  }

  async findById(id: string, client?: PoolClient): Promise<any | null> {
    const query = `
      SELECT ${this.selectColumns}
      FROM room_change_requests rc
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
      requestedBedId: number;
      currentBedId: number;
      note?: string | null;
    },
    client?: PoolClient,
  ): Promise<any> {
    const query = `
      INSERT INTO room_change_requests
        (booking_id, student_id, semester_id, requested_bed_id, current_bed_id, note)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${this.selectColumns}
    `;
    const result = await this.getClient(client).query(query, [
      data.bookingId,
      data.studentId,
      data.semesterId,
      data.requestedBedId,
      data.currentBedId,
      data.note ?? null,
    ]);
    return result.rows[0];
  }

  async resolve(
    id: string,
    data: {
      approved: boolean;
      resolvedBy: string;
      rejectionReason?: string | null;
    },
    client?: PoolClient,
  ): Promise<any | null> {
    const status = data.approved ? 'approved' : 'rejected';
    const query = `
      UPDATE room_change_requests
      SET
        status           = $1,
        resolved_by      = $2,
        resolved_at      = NOW(),
        rejection_reason = $3,
        updated_at       = NOW()
      WHERE id = $4 AND status = 'pending'
      RETURNING ${this.selectColumns}
    `;
    const result = await this.getClient(client).query(query, [
      status,
      data.resolvedBy,
      data.rejectionReason ?? null,
      id,
    ]);
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
        b.ownership    AS "bedOwnership",
        l.id           AS "roomId",
        l.room_type_id AS "roomTypeId",
        l.gender_lock  AS "genderLock",
        l.is_tr_only   AS "roomIsTrOnly",
        l.is_foreigner_only AS "roomIsForeignerOnly",
        l.is_guest_zone AS "roomIsGuestZone",
        l.ownership    AS "roomOwnership"
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
        ownership: row.bedOwnership,
        locationId: row.roomId,
      },
      room: {
        id: row.roomId,
        roomTypeId: row.roomTypeId,
        genderLock: row.genderLock,
        isTrOnly: row.roomIsTrOnly,
        isForeignerOnly: row.roomIsForeignerOnly,
        isGuestZone: row.roomIsGuestZone,
        ownership: row.roomOwnership,
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
        bk.bed_id        AS "bedId",
        bk.semester_id   AS "semesterId",
        bk.status,
        bk.room_changes_count AS "roomChangesCount",
        s.max_room_changes    AS "maxRoomChanges"
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

  async findAvailableBedsForBooking(bookingId: string): Promise<any[]> {
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
      ORDER BY l.name, b.label
    `;
    const result = await this.db.getPool().query(query, [bookingId]);
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
