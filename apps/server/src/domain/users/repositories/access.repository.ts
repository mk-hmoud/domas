import { Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class AccessRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  // --- Roles ---

  async createRole(
    name: string,
    description?: string,
    isSystemRole = false,
    client?: PoolClient,
  ): Promise<Role> {
    const query = `
      INSERT INTO roles (name, description, is_system_role)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, is_system_role as "isSystemRole"
    `;
    const result = await this.getClient(client).query<Role>(query, [
      name,
      description,
      isSystemRole,
    ]);
    return new Role(result.rows[0]);
  }

  async findRoleByName(name: string, client?: PoolClient): Promise<Role | null> {
    const query = `SELECT id, name, description, is_system_role as "isSystemRole" FROM roles WHERE name = $1`;
    const result = await this.getClient(client).query<Role>(query, [name]);
    return result.rows[0] ? new Role(result.rows[0]) : null;
  }

  async findRoleById(id: number, client?: PoolClient): Promise<Role | null> {
    const query = `SELECT id, name, description, is_system_role as "isSystemRole" FROM roles WHERE id = $1`;
    const result = await this.getClient(client).query<Role>(query, [id]);
    return result.rows[0] ? new Role(result.rows[0]) : null;
  }

  async updateRole(
    id: number,
    data: { name?: string; description?: string },
    client?: PoolClient,
  ): Promise<Role | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (updates.length === 0) {
      return this.findRoleById(id, client);
    }

    values.push(id);
    const query = `
      UPDATE roles
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, description, is_system_role as "isSystemRole"
    `;
    const result = await this.getClient(client).query<Role>(query, values);
    return result.rows[0] ? new Role(result.rows[0]) : null;
  }

  async deleteRole(id: number, client?: PoolClient): Promise<boolean> {
    const query = `DELETE FROM roles WHERE id = $1`;
    const result = await this.getClient(client).query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async replaceRolePermissions(
    roleId: number,
    permissionIds: number[],
    client?: PoolClient,
  ): Promise<void> {
    const db = this.getClient(client);

    // 1. Delete existing
    await db.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);

    // 2. Insert new
    if (permissionIds.length > 0) {
      // Create values string: ($1, $2), ($1, $3), ...
      // Actually simpler loop is fine for now, or UNNEST.
      // Let's use loop for simplicity with current setup.
      for (const permId of permissionIds) {
        await db.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [roleId, permId],
        );
      }
    }
  }

  async findAllRoles(client?: PoolClient): Promise<Role[]> {
    const query = `
      SELECT 
        r.id, 
        r.name, 
        r.description, 
        r.is_system_role as "isSystemRole",
        COALESCE(
          json_agg(
            json_build_object('id', p.id, 'slug', p.slug, 'description', p.description)
          ) FILTER (WHERE p.id IS NOT NULL), 
          '[]'
        ) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY r.id
    `;
    const result = await this.getClient(client).query(query);
    return result.rows.map((r) => {
      const role = new Role(r);
      role.permissions = r.permissions.map((p: any) => new Permission(p));
      return role;
    });
  }

  // --- Permissions ---

  async createPermission(
    slug: string,
    description?: string,
    client?: PoolClient,
  ): Promise<Permission> {
    const query = `
      INSERT INTO permissions (slug, description)
      VALUES ($1, $2)
      RETURNING id, slug, description
    `;
    const result = await this.getClient(client).query<Permission>(query, [slug, description]);
    return new Permission(result.rows[0]);
  }

  async findAllPermissions(client?: PoolClient): Promise<Permission[]> {
    const query = `SELECT id, slug, description FROM permissions`;
    const result = await this.getClient(client).query<Permission>(query);
    return result.rows.map((p) => new Permission(p));
  }

  async findPermissionBySlug(slug: string, client?: PoolClient): Promise<Permission | null> {
    const query = `SELECT id, slug, description FROM permissions WHERE slug = $1`;
    const result = await this.getClient(client).query<Permission>(query, [slug]);
    return result.rows[0] ? new Permission(result.rows[0]) : null;
  }

  // --- Assignments ---

  async assignRoleToUser(userId: string, roleId: number, client?: PoolClient): Promise<void> {
    const query = `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`;
    await this.getClient(client).query(query, [userId, roleId]);
  }

  async assignPermissionsToRole(
    roleId: number,
    permissionIds: number[],
    client?: PoolClient,
  ): Promise<void> {
    // Bulk insert
    if (permissionIds.length === 0) return;

    // Simple loop for now or unnest
    for (const permId of permissionIds) {
      const query = `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`;
      await this.getClient(client).query(query, [roleId, permId]);
    }
  }

  async getRolesForUser(userId: string, client?: PoolClient): Promise<Role[]> {
    const query = `
      SELECT r.id, r.name, r.description, r.is_system_role as "isSystemRole"
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `;
    const result = await this.getClient(client).query<Role>(query, [userId]);
    return result.rows.map((r) => new Role(r));
  }

  async getPermissionsForUser(userId: string, client?: PoolClient): Promise<string[]> {
    const query = `
      SELECT DISTINCT p.slug
      FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      JOIN user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = $1
    `;
    const result = await this.getClient(client).query<{ slug: string }>(query, [userId]);
    return result.rows.map((r) => r.slug);
  }

  async getPermissionsForRole(roleId: number, client?: PoolClient): Promise<Permission[]> {
    const query = `
        SELECT p.id, p.slug, p.description
        FROM permissions p
        JOIN role_permissions rp ON rp.permission_id = p.id
        WHERE rp.role_id = $1
      `;
    const result = await this.getClient(client).query<Permission>(query, [roleId]);
    return result.rows.map((p) => new Permission(p));
  }
}
