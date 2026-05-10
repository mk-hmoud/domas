import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';

@Injectable()
export class PreReservationsRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient) {
    return client || this.db.getPool();
  }

  private get selectColumns(): string {
    return `
      pr.id,
      pr.student_id       AS "studentId",
      pr.semester_id      AS "semesterId",
      pr.start_date       AS "startDate",
      pr.end_date         AS "endDate",
      pr.room_type_id     AS "roomTypeId",
      pr.note,
      pr.status,
      pr.booking_id       AS "bookingId",
      pr.resolved_by      AS "resolvedBy",
      pr.resolved_at      AS "resolvedAt",
      pr.rejection_reason AS "rejectionReason",
      pr.created_at       AS "createdAt",
      pr.updated_at       AS "updatedAt"
    `;
  }

  async findAll(params?: { semesterId?: number; status?: string }): Promise<any[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (params?.semesterId != null) {
      conditions.push(`pr.semester_id = $${i++}`);
      values.push(params.semesterId);
    }
    if (params?.status) {
      conditions.push(`pr.status = $${i++}`);
      values.push(params.status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        ${this.selectColumns},
        st.first_name || ' ' || st.last_name AS "studentName",
        st.student_number                    AS "studentNumber",
        s.display_name                       AS "semesterDisplayName",
        rt.name                              AS "roomTypeName"
      FROM  pre_reservations pr
      JOIN  students  st ON pr.student_id  = st.id
      JOIN  semesters s  ON pr.semester_id = s.id
      LEFT JOIN room_types rt ON pr.room_type_id = rt.id
      ${where}
      ORDER BY pr.created_at DESC
    `;
    const result = await this.db.getPool().query(query, values);
    return result.rows;
  }

  async findByStudent(studentId: string): Promise<any[]> {
    const query = `
      SELECT
        pr.id,
        pr.semester_id      AS "semesterId",
        pr.start_date       AS "startDate",
        pr.end_date         AS "endDate",
        pr.room_type_id     AS "roomTypeId",
        pr.note,
        pr.status,
        pr.booking_id       AS "bookingId",
        pr.rejection_reason AS "rejectionReason",
        pr.resolved_at      AS "resolvedAt",
        pr.created_at       AS "createdAt",
        s.display_name      AS "semesterDisplayName",
        rt.name             AS "roomTypeName"
      FROM  pre_reservations pr
      JOIN  semesters s ON pr.semester_id = s.id
      LEFT JOIN room_types rt ON pr.room_type_id = rt.id
      WHERE pr.student_id = $1
      ORDER BY pr.created_at DESC
    `;
    const result = await this.db.getPool().query(query, [studentId]);
    return result.rows;
  }

  async findById(id: string, client?: PoolClient): Promise<any | null> {
    const query = `
      SELECT ${this.selectColumns}
      FROM pre_reservations pr
      WHERE pr.id = $1
    `;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ?? null;
  }

  async findSemester(semesterId: number, client?: PoolClient): Promise<any | null> {
    const query = `
      SELECT id, start_date AS "startDate", end_date AS "endDate",
             allow_pre_reservations AS "allowPreReservations"
      FROM semesters WHERE id = $1
    `;
    const result = await this.getClient(client).query(query, [semesterId]);
    return result.rows[0] ?? null;
  }

  async hasPendingForStudentSemester(
    studentId: string,
    semesterId: number,
    client?: PoolClient,
  ): Promise<boolean> {
    const result = await this.getClient(client).query(
      `SELECT 1 FROM pre_reservations
       WHERE student_id = $1 AND semester_id = $2 AND status = 'pending'
       LIMIT 1`,
      [studentId, semesterId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async create(
    data: {
      studentId: string;
      semesterId: number;
      startDate: string;
      endDate: string;
      roomTypeId?: number | null;
      note?: string | null;
    },
    client?: PoolClient,
  ): Promise<any> {
    const query = `
      WITH pr AS (
        INSERT INTO pre_reservations
          (student_id, semester_id, start_date, end_date, room_type_id, note)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      )
      SELECT
        pr.id,
        pr.student_id       AS "studentId",
        pr.semester_id      AS "semesterId",
        pr.start_date       AS "startDate",
        pr.end_date         AS "endDate",
        pr.room_type_id     AS "roomTypeId",
        pr.note,
        pr.status,
        pr.booking_id       AS "bookingId",
        pr.rejection_reason AS "rejectionReason",
        pr.resolved_at      AS "resolvedAt",
        pr.created_at       AS "createdAt",
        s.display_name      AS "semesterDisplayName",
        rt.name             AS "roomTypeName"
      FROM pr
      JOIN semesters s ON pr.semester_id = s.id
      LEFT JOIN room_types rt ON pr.room_type_id = rt.id
    `;
    const result = await this.getClient(client).query(query, [
      data.studentId,
      data.semesterId,
      data.startDate,
      data.endDate,
      data.roomTypeId ?? null,
      data.note ?? null,
    ]);
    return result.rows[0];
  }

  async cancel(id: string, studentId: string): Promise<boolean> {
    const result = await this.db.getPool().query(
      `UPDATE pre_reservations SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND student_id = $2 AND status = 'pending'`,
      [id, studentId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async assign(
    id: string,
    data: { bookingId: string; resolvedBy: string },
    client?: PoolClient,
  ): Promise<any | null> {
    const query = `
      WITH pr AS (
        UPDATE pre_reservations
        SET
          status      = 'assigned',
          booking_id  = $1,
          resolved_by = $2,
          resolved_at = NOW(),
          updated_at  = NOW()
        WHERE id = $3 AND status = 'pending'
        RETURNING *
      )
      SELECT
        ${this.selectColumns},
        st.first_name || ' ' || st.last_name AS "studentName",
        st.student_number                    AS "studentNumber",
        s.display_name                       AS "semesterDisplayName",
        rt.name                              AS "roomTypeName"
      FROM  pr
      JOIN  students  st ON pr.student_id  = st.id
      JOIN  semesters s  ON pr.semester_id = s.id
      LEFT JOIN room_types rt ON pr.room_type_id = rt.id
    `;
    const result = await this.getClient(client).query(query, [data.bookingId, data.resolvedBy, id]);
    return result.rows[0] ?? null;
  }

  async reject(
    id: string,
    data: { resolvedBy: string; rejectionReason?: string | null },
    client?: PoolClient,
  ): Promise<any | null> {
    const query = `
      WITH pr AS (
        UPDATE pre_reservations
        SET
          status           = 'rejected',
          resolved_by      = $1,
          resolved_at      = NOW(),
          rejection_reason = $2,
          updated_at       = NOW()
        WHERE id = $3 AND status = 'pending'
        RETURNING *
      )
      SELECT
        ${this.selectColumns},
        st.first_name || ' ' || st.last_name AS "studentName",
        st.student_number                    AS "studentNumber",
        s.display_name                       AS "semesterDisplayName",
        rt.name                              AS "roomTypeName"
      FROM  pr
      JOIN  students  st ON pr.student_id  = st.id
      JOIN  semesters s  ON pr.semester_id = s.id
      LEFT JOIN room_types rt ON pr.room_type_id = rt.id
    `;
    const result = await this.getClient(client).query(query, [
      data.resolvedBy,
      data.rejectionReason ?? null,
      id,
    ]);
    return result.rows[0] ?? null;
  }

  async findAvailableBeds(params: {
    semesterId: number;
    startDate: string;
    endDate: string;
  }): Promise<any[]> {
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
      FROM beds b
      JOIN locations l ON b.location_id = l.id
      WHERE b.deleted_at IS NULL
        AND b.status = 'available'
        AND b.is_guest_zone = FALSE
        AND b.ownership = 'dorm'
        -- exclude beds already booked during the requested date range in this semester
        AND b.id NOT IN (
          SELECT bed_id FROM bookings
          WHERE  semester_id = $1
            AND  status NOT IN ('cancelled', 'rejected', 'draft')
            AND  daterange(start_date, end_date, '[]') &&
                 daterange($2::date, $3::date, '[]')
        )
      ORDER BY l.name, b.label
    `;
    const result = await this.db
      .getPool()
      .query(query, [params.semesterId, params.startDate, params.endDate]);
    return result.rows;
  }

  async isBedTakenForDateRange(
    bedId: number,
    semesterId: number,
    startDate: string,
    endDate: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const result = await this.getClient(client).query(
      `SELECT 1 FROM bookings
       WHERE bed_id = $1
         AND semester_id = $2
         AND status NOT IN ('cancelled', 'rejected', 'draft')
         AND daterange(start_date, end_date, '[]') && daterange($3::date, $4::date, '[]')
       LIMIT 1`,
      [bedId, semesterId, startDate, endDate],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
