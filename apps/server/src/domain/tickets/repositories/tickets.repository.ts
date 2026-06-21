import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { LocationScope } from '../../../common/interfaces/location-scope.interface';
import { Ticket } from '../entities/ticket.entity';
import { TicketStatus } from '../../../common/enums/ticket-status.enum';
import { TicketCategory } from '../../../common/enums/ticket-category.enum';

@Injectable()
export class TicketsRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly locationScopeService: LocationScopeService,
  ) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  private get selectColumns(): string {
    return `
      t.id,
      t.student_id        AS "studentId",
      t.booking_id        AS "bookingId",
      t.location_id        AS "locationId",
      t.category,
      t.title,
      t.description,
      t.status,
      t.work_order_id      AS "workOrderId",
      t.reviewed_by        AS "reviewedBy",
      t.reviewed_at        AS "reviewedAt",
      t.resolution_notes   AS "resolutionNotes",
      t.rejection_reason   AS "rejectionReason",
      t.resolved_at        AS "resolvedAt",
      t.created_at         AS "createdAt",
      t.updated_at         AS "updatedAt"
    `;
  }

  async findByStudent(studentId: string): Promise<any[]> {
    const query = `
      SELECT
        ${this.selectColumns},
        l.name AS "locationName"
      FROM tickets t
      JOIN locations l ON t.location_id = l.id
      WHERE t.student_id = $1
      ORDER BY t.created_at DESC
    `;
    const result = await this.db.getPool().query(query, [studentId]);
    return result.rows;
  }

  async findAll(
    filters: { status?: TicketStatus; category?: TicketCategory },
    scope?: LocationScope,
  ): Promise<any[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    const scopeFilter = this.locationScopeService.buildScopeClause(
      scope,
      'l.tree_path',
      values.length + 1,
    );
    if (scopeFilter.param) values.push(scopeFilter.param);
    conditions.push(scopeFilter.clause);

    if (filters.status) {
      values.push(filters.status);
      conditions.push(`t.status = $${values.length}`);
    }
    if (filters.category) {
      values.push(filters.category);
      conditions.push(`t.category = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        ${this.selectColumns},
        l.name                                   AS "locationName",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> l.tree_path AND anc.deleted_at IS NULL
        )                                         AS "locationPath",
        st.first_name || ' ' || st.last_name      AS "studentName",
        wo.status                                 AS "workOrderStatus",
        wo.assigned_to                            AS "workOrderAssignedTo",
        assignee.first_name || ' ' || assignee.last_name AS "workOrderAssignedToName",
        wo.completed_at                           AS "workOrderCompletedAt"
      FROM       tickets t
      JOIN       locations l        ON t.location_id = l.id
      JOIN       students st        ON t.student_id = st.id
      LEFT JOIN  work_orders wo     ON t.work_order_id = wo.id
      LEFT JOIN  users assignee     ON wo.assigned_to = assignee.id
      ${where}
      ORDER BY t.created_at DESC
    `;
    const result = await this.db.getPool().query(query, values);
    return result.rows;
  }

  async findById(id: string, client?: PoolClient): Promise<any | null> {
    const query = `
      SELECT ${this.selectColumns}, l.tree_path AS "treePath"
      FROM tickets t
      JOIN locations l ON t.location_id = l.id
      WHERE t.id = $1
    `;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ?? null;
  }

  async create(
    data: {
      studentId: string;
      bookingId?: string | null;
      locationId: number;
      category: TicketCategory;
      title: string;
      description: string;
    },
    client?: PoolClient,
  ): Promise<Ticket> {
    const query = `
      INSERT INTO tickets (student_id, booking_id, location_id, category, title, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, student_id AS "studentId", booking_id AS "bookingId", location_id AS "locationId",
                category, title, description, status, work_order_id AS "workOrderId",
                reviewed_by AS "reviewedBy", reviewed_at AS "reviewedAt",
                resolution_notes AS "resolutionNotes", rejection_reason AS "rejectionReason",
                resolved_at AS "resolvedAt", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const result = await this.getClient(client).query(query, [
      data.studentId,
      data.bookingId ?? null,
      data.locationId,
      data.category,
      data.title,
      data.description,
    ]);
    return new Ticket(result.rows[0]);
  }

  async resolve(
    id: string,
    data: { resolutionNotes: string; reviewedBy: string },
    client?: PoolClient,
  ): Promise<any | null> {
    const query = `
      WITH t AS (
        UPDATE tickets
        SET status = 'resolved',
            resolution_notes = $1,
            reviewed_by = $2,
            reviewed_at = NOW(),
            resolved_at = NOW(),
            updated_at = NOW()
        WHERE id = $3 AND status = 'open'
        RETURNING *
      )
      SELECT ${this.selectColumns} FROM t
    `;
    const result = await this.getClient(client).query(query, [
      data.resolutionNotes,
      data.reviewedBy,
      id,
    ]);
    return result.rows[0] ?? null;
  }

  async reject(
    id: string,
    data: { rejectionReason: string; reviewedBy: string },
    client?: PoolClient,
  ): Promise<any | null> {
    const query = `
      WITH t AS (
        UPDATE tickets
        SET status = 'rejected',
            rejection_reason = $1,
            reviewed_by = $2,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = $3 AND status = 'open'
        RETURNING *
      )
      SELECT ${this.selectColumns} FROM t
    `;
    const result = await this.getClient(client).query(query, [
      data.rejectionReason,
      data.reviewedBy,
      id,
    ]);
    return result.rows[0] ?? null;
  }

  async escalate(
    id: string,
    data: { workOrderId: string; reviewedBy: string },
    client?: PoolClient,
  ): Promise<any | null> {
    const query = `
      WITH t AS (
        UPDATE tickets
        SET status = 'escalated',
            work_order_id = $1,
            reviewed_by = $2,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = $3 AND status = 'open'
        RETURNING *
      )
      SELECT ${this.selectColumns} FROM t
    `;
    const result = await this.getClient(client).query(query, [
      data.workOrderId,
      data.reviewedBy,
      id,
    ]);
    return result.rows[0] ?? null;
  }

  /** Called when a linked work order completes. Returns the affected ticket, or null if none was linked. */
  async markResolvedFromWorkOrder(workOrderId: string, client?: PoolClient): Promise<any | null> {
    const query = `
      WITH t AS (
        UPDATE tickets
        SET status = 'resolved',
            resolved_at = NOW(),
            updated_at = NOW()
        WHERE work_order_id = $1 AND status = 'escalated'
        RETURNING *
      )
      SELECT ${this.selectColumns} FROM t
    `;
    const result = await this.getClient(client).query(query, [workOrderId]);
    return result.rows[0] ?? null;
  }
}
