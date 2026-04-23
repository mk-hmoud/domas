import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { RectorBedsResponse, RectorResident } from '@domas/ts-types';

@Injectable()
export class RectorService {
  constructor(private readonly db: DatabaseService) {}

  async getBeds(): Promise<RectorBedsResponse> {
    const pool = this.db.getPool();
    const result = await pool.query(`
      SELECT
        b.id,
        b.label,
        b.status,
        l.name AS "locationName",
        (
          SELECT string_agg(loc.name, ' > ' ORDER BY loc.tree_path)
          FROM locations loc
          WHERE loc.tree_path @> l.tree_path AND loc.deleted_at IS NULL
        ) AS "locationPath",
        (
          SELECT s.first_name || ' ' || s.last_name
          FROM bookings bk
          JOIN students s ON s.id = bk.student_id
          WHERE bk.bed_id = b.id
            AND bk.status IN ('active', 'ready_for_checkin')
          LIMIT 1
        ) AS "residentName"
      FROM beds b
      JOIN locations l ON l.id = b.location_id
      WHERE b.ownership = 'rectorate'
        AND b.deleted_at IS NULL
      ORDER BY l.tree_path, b.label
    `);

    const beds = result.rows;
    return {
      beds,
      total: beds.length,
      available: beds.filter((b) => b.status === 'available').length,
      occupied: beds.filter((b) => b.status === 'occupied').length,
    };
  }

  async getResidents(): Promise<RectorResident[]> {
    const pool = this.db.getPool();
    const result = await pool.query(`
      SELECT
        bk.id AS "bookingId",
        s.first_name || ' ' || s.last_name AS "studentName",
        s.student_number AS "studentNumber",
        b.label AS "bedLabel",
        l.name AS "locationName",
        (
          SELECT string_agg(loc.name, ' > ' ORDER BY loc.tree_path)
          FROM locations loc
          WHERE loc.tree_path @> l.tree_path AND loc.deleted_at IS NULL
        ) AS "locationPath",
        bk.start_date AS "startDate",
        bk.end_date AS "endDate",
        bk.status
      FROM bookings bk
      JOIN beds b ON b.id = bk.bed_id
      JOIN locations l ON l.id = b.location_id
      JOIN students s ON s.id = bk.student_id
      WHERE b.ownership = 'rectorate'
        AND bk.status IN ('active', 'ready_for_checkin', 'pending_accounting', 'confirmed')
      ORDER BY bk.start_date DESC
    `);

    return result.rows;
  }
}
