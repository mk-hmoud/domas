import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  private getSelectColumns(includePassword = false, tableAlias?: string): string {
    const prefix = tableAlias ? `${tableAlias}.` : '';
    const columns = [
      `${prefix}id`,
      `${prefix}email`,
      `${prefix}first_name as "firstName"`,
      `${prefix}last_name as "lastName"`,
      `${prefix}phone_number as "phoneNumber"`,
      `${prefix}is_active as "isActive"`,
      `${prefix}is_recovery_admin as "isRecoveryAdmin"`,
      `${prefix}onboarding_completed as "onboardingCompleted"`,
      `${prefix}created_at as "createdAt"`,
      `${prefix}updated_at as "updatedAt"`,
    ];

    if (includePassword) {
      columns.push(`${prefix}password_hash as "passwordHash"`);
    }

    return columns.join(', ');
  }

  private mapRowToEntity(row: any): User {
    return new User({
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      phoneNumber: row.phoneNumber,
      passwordHash: row.passwordHash,
      isActive: row.isActive,
      isRecoveryAdmin: row.isRecoveryAdmin,
      onboardingCompleted: row.onboardingCompleted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(
    data: CreateUserDto & { isRecoveryAdmin?: boolean; password: string },
    client?: PoolClient,
  ): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone_number, is_active, is_recovery_admin)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${this.getSelectColumns(false)}
    `;
    const values = [
      data.email,
      data.password,
      data.firstName || null,
      data.lastName || null,
      data.phoneNumber || null,
      true,
      data.isRecoveryAdmin || false,
    ];

    const result = await this.getClient(client).query<User>(query, values);
    return new User(result.rows[0]);
  }

  async findAll(
    pagination: PaginationDto,
    client?: PoolClient,
    context?: AuditUserContext,
  ): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const isAdmin =
      !context || context.isRecoveryAdmin || context.roles?.some((r) => r.name === 'Admin');

    const adminFilter = isAdmin
      ? ''
      : `
        AND u.is_recovery_admin = FALSE
        AND NOT EXISTS (
          SELECT 1 FROM user_roles ur_check
          JOIN roles r_check ON ur_check.role_id = r_check.id
          WHERE ur_check.user_id = u.id AND r_check.name = 'Admin'
        )
      `;

    const query = `
      SELECT 
        ${this.getSelectColumns(false, 'u')},
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'name', r.name, 'description', r.description, 'isSystemRole', r.is_system_role)
          ) FILTER (WHERE r.id IS NOT NULL), 
          '[]'
        ) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.deleted_at IS NULL ${adminFilter}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const countQuery = `
      SELECT COUNT(*) FROM users u 
      WHERE u.deleted_at IS NULL ${adminFilter}
    `;

    const dbClient = this.getClient(client);
    const [result, countResult] = await Promise.all([
      dbClient.query(query, [limit, offset]),
      dbClient.query<{ count: string }>(countQuery),
    ]);

    return {
      data: result.rows.map((row) => {
        const user = this.mapRowToEntity(row);
        user.roles = row.roles;
        return user;
      }),
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  async findByEmail(
    email: string,
    client?: PoolClient,
    includePassword = false,
  ): Promise<User | null> {
    const query = `
      SELECT ${this.getSelectColumns(includePassword)}
      FROM users
      WHERE email = $1 AND deleted_at IS NULL
    `;
    const result = await this.getClient(client).query<User>(query, [email]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async findById(
    id: string,
    client?: PoolClient,
    includePassword = false,
    context?: AuditUserContext,
  ): Promise<User | null> {
    const isAdmin =
      !context || context.isRecoveryAdmin || context.roles?.some((r) => r.name === 'Admin');

    let adminFilter = '';
    if (!isAdmin) {
      adminFilter = `
        AND is_recovery_admin = FALSE
        AND NOT EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = users.id AND r.name = 'Admin'
        )
      `;
    }

    const query = `
      SELECT ${this.getSelectColumns(includePassword)}
      FROM users
      WHERE id = $1 AND deleted_at IS NULL ${adminFilter}
    `;
    const result = await this.getClient(client).query<User>(query, [id]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async update(
    id: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      isActive?: boolean;
      passwordHash?: string;
    },
    client?: PoolClient,
  ): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(data.lastName);
    }
    if (data.phoneNumber !== undefined) {
      updates.push(`phone_number = $${paramIndex++}`);
      values.push(data.phoneNumber);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }
    if (data.passwordHash) {
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(data.passwordHash);
    }

    if (updates.length === 0) {
      return this.findById(id, client);
    }

    values.push(id);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING ${this.getSelectColumns(false)}
    `;

    const result = await this.getClient(client).query<User>(query, values);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  async completeOnboarding(id: string, client?: PoolClient): Promise<void> {
    const query = `
      UPDATE users SET onboarding_completed = TRUE, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `;
    await this.getClient(client).query(query, [id]);
  }

  async delete(id: string, client?: PoolClient): Promise<boolean> {
    const query = `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`;
    const result = await this.getClient(client).query(query, [id]);
    return (result.rowCount || 0) > 0;
  }
}
