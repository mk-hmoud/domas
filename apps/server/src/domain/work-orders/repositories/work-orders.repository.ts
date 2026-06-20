import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { LocationScope } from '../../../common/interfaces/location-scope.interface';
import { WorkOrder } from '../entities/work-order.entity';
import { WorkOrderStatus } from '../../../common/enums/work-order-status.enum';
import { WorkOrderPriority } from '../../../common/enums/work-order-priority.enum';
import { PERMISSIONS } from '../../../common/constants/permissions';

@Injectable()
export class WorkOrdersRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly locationScopeService: LocationScopeService,
  ) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  private get selectColumns(): string {
    return `
      wo.id,
      wo.title,
      wo.description,
      wo.location_id        AS "locationId",
      wo.status,
      wo.priority,
      wo.assigned_to        AS "assignedTo",
      wo.created_by         AS "createdBy",
      wo.due_date           AS "dueDate",
      wo.completion_notes   AS "completionNotes",
      wo.completed_at       AS "completedAt",
      wo.created_at         AS "createdAt",
      wo.updated_at         AS "updatedAt"
    `;
  }

  async findAll(
    filters: {
      status?: WorkOrderStatus;
      priority?: WorkOrderPriority;
      locationId?: number;
      assignedTo?: string;
    },
    scope?: LocationScope,
  ): Promise<any[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters.assignedTo) {
      // Technician Staff: only ever their own assigned work orders, regardless of location scope.
      values.push(filters.assignedTo);
      conditions.push(`wo.assigned_to = $${values.length}`);
    } else {
      const scopeFilter = this.locationScopeService.buildScopeClause(
        scope,
        'l.tree_path',
        values.length + 1,
      );
      if (scopeFilter.param) values.push(scopeFilter.param);
      conditions.push(scopeFilter.clause);
    }

    if (filters.status) {
      values.push(filters.status);
      conditions.push(`wo.status = $${values.length}`);
    }
    if (filters.priority) {
      values.push(filters.priority);
      conditions.push(`wo.priority = $${values.length}`);
    }
    if (filters.locationId != null) {
      values.push(filters.locationId);
      conditions.push(`wo.location_id = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        ${this.selectColumns},
        l.name                                  AS "locationName",
        (
          SELECT string_agg(anc.name, ' > ' ORDER BY nlevel(anc.tree_path))
          FROM   locations anc
          WHERE  anc.tree_path @> l.tree_path AND anc.deleted_at IS NULL
        )                                        AS "locationPath",
        assignee.first_name || ' ' || assignee.last_name AS "assignedToName",
        creator.first_name || ' ' || creator.last_name   AS "createdByName"
      FROM       work_orders wo
      JOIN       locations l        ON wo.location_id = l.id
      LEFT JOIN  users     assignee ON wo.assigned_to = assignee.id
      JOIN       users     creator  ON wo.created_by   = creator.id
      ${where}
      ORDER BY wo.created_at DESC
    `;
    const result = await this.db.getPool().query(query, values);
    return result.rows;
  }

  async findById(id: string, client?: PoolClient): Promise<any | null> {
    const query = `
      SELECT ${this.selectColumns}, l.tree_path AS "treePath", l.name AS "locationName"
      FROM work_orders wo
      JOIN locations l ON wo.location_id = l.id
      WHERE wo.id = $1
    `;
    const result = await this.getClient(client).query(query, [id]);
    return result.rows[0] ?? null;
  }

  async create(
    data: {
      title: string;
      description?: string | null;
      locationId: number;
      status: WorkOrderStatus;
      priority: WorkOrderPriority;
      assignedTo?: string | null;
      createdBy: string;
      dueDate?: string | null;
    },
    client?: PoolClient,
  ): Promise<WorkOrder> {
    const query = `
      INSERT INTO work_orders
        (title, description, location_id, status, priority, assigned_to, created_by, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await this.getClient(client).query(query, [
      data.title,
      data.description ?? null,
      data.locationId,
      data.status,
      data.priority,
      data.assignedTo ?? null,
      data.createdBy,
      data.dueDate ?? null,
    ]);
    return new WorkOrder(this.mapRow(result.rows[0]));
  }

  async assign(id: string, assignedTo: string, client?: PoolClient): Promise<any | null> {
    const query = `
      WITH wo AS (
        UPDATE work_orders
        SET assigned_to = $1,
            status      = CASE WHEN status = 'pending' THEN 'assigned' ELSE status END,
            updated_at  = NOW()
        WHERE id = $2
        RETURNING *
      )
      SELECT ${this.selectColumns} FROM wo
    `;
    const result = await this.getClient(client).query(query, [assignedTo, id]);
    return result.rows[0] ?? null;
  }

  async updateStatus(
    id: string,
    status: WorkOrderStatus,
    completionNotes: string | undefined,
    client?: PoolClient,
  ): Promise<any | null> {
    const isCompleted = status === WorkOrderStatus.COMPLETED;
    const query = `
      WITH wo AS (
        UPDATE work_orders
        SET status            = $1,
            completion_notes  = COALESCE($2, completion_notes),
            completed_at      = CASE WHEN $3 THEN NOW() ELSE completed_at END,
            updated_at        = NOW()
        WHERE id = $4
        RETURNING *
      )
      SELECT ${this.selectColumns} FROM wo
    `;
    const result = await this.getClient(client).query(query, [
      status,
      completionNotes ?? null,
      isCompleted,
      id,
    ]);
    return result.rows[0] ?? null;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      locationId?: number;
      priority?: WorkOrderPriority;
      dueDate?: string;
      status?: WorkOrderStatus;
    },
    client?: PoolClient,
  ): Promise<any | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      values.push(data.title);
      updates.push(`title = $${values.length}`);
    }
    if (data.description !== undefined) {
      values.push(data.description);
      updates.push(`description = $${values.length}`);
    }
    if (data.locationId !== undefined) {
      values.push(data.locationId);
      updates.push(`location_id = $${values.length}`);
    }
    if (data.priority !== undefined) {
      values.push(data.priority);
      updates.push(`priority = $${values.length}`);
    }
    if (data.dueDate !== undefined) {
      values.push(data.dueDate);
      updates.push(`due_date = $${values.length}`);
    }
    if (data.status !== undefined) {
      values.push(data.status);
      updates.push(`status = $${values.length}`);
    }

    if (updates.length === 0) {
      return this.findById(id, client);
    }

    values.push(id);
    const query = `
      WITH wo AS (
        UPDATE work_orders
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING *
      )
      SELECT ${this.selectColumns} FROM wo
    `;
    const result = await this.getClient(client).query(query, values);
    return result.rows[0] ?? null;
  }

  /** Users who hold `work_orders.update` (i.e. Technician Staff) within the given location scope. */
  async findAssignableTechnicians(scope?: LocationScope, client?: PoolClient): Promise<any[]> {
    const values: any[] = [PERMISSIONS.WORK_ORDERS_UPDATE];
    const scopeFilter = this.locationScopeService.buildScopeClause(
      scope,
      'l.tree_path',
      values.length + 1,
    );
    if (scopeFilter.param) values.push(scopeFilter.param);

    const query = `
      SELECT DISTINCT
        u.id,
        u.first_name AS "firstName",
        u.last_name  AS "lastName",
        u.email
      FROM       users u
      JOIN       user_roles ur        ON ur.user_id = u.id
      JOIN       role_permissions rp  ON rp.role_id = ur.role_id
      JOIN       permissions p        ON p.id = rp.permission_id AND p.slug = $1
      JOIN       staff_locations sl   ON sl.user_id = u.id
      JOIN       locations l          ON l.id = sl.location_id AND l.deleted_at IS NULL
      WHERE u.deleted_at IS NULL AND u.is_active = TRUE AND ${scopeFilter.clause}
      ORDER BY u.first_name, u.last_name
    `;
    const result = await this.getClient(client).query(query, values);
    return result.rows;
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      locationId: row.location_id,
      status: row.status,
      priority: row.priority,
      assignedTo: row.assigned_to,
      createdBy: row.created_by,
      dueDate: row.due_date,
      completionNotes: row.completion_notes,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
