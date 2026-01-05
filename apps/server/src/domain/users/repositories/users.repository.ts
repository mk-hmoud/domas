import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  private getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.db.getPool();
  }

  async create(data: CreateUserDto & { passwordHash: string }, client?: PoolClient): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, 
        email, 
        password_hash as "passwordHash", 
        role, 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;
    const values = [data.email, data.passwordHash, data.role, true];
    const result = await this.getClient(client).query<User>(query, values);
    return new User(result.rows[0]);
  }

  async findAll(
    pagination: PaginationDto,
    role?: UserRole | UserRole[],
    client?: PoolClient,
  ): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, 
        email, 
        password_hash as "passwordHash", 
        role, 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM users
    `;
    const values: any[] = [];
    let countQuery = `SELECT COUNT(*) FROM users`;
    const countValues: any[] = [];

    if (role) {
      if (Array.isArray(role)) {
        query += ` WHERE role = ANY($1)`;
        countQuery += ` WHERE role = ANY($1)`;
      } else {
        query += ` WHERE role = $1`;
        countQuery += ` WHERE role = $1`;
      }
      values.push(role);
      countValues.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const dbClient = this.getClient(client);
    const [result, countResult] = await Promise.all([
      dbClient.query<User>(query, values),
      dbClient.query<{ count: string }>(countQuery, countValues),
    ]);

    return {
      data: result.rows.map((row) => new User(row)),
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  async existsByRole(role: UserRole, client?: PoolClient): Promise<boolean> {
    const query = `SELECT 1 FROM users WHERE role = $1 LIMIT 1`;
    const result = await this.getClient(client).query(query, [role]);
    return (result.rowCount || 0) > 0;
  }

  async findByEmail(email: string, client?: PoolClient): Promise<User | null> {
    const query = `
      SELECT 
        id, 
        email, 
        password_hash as "passwordHash", 
        role, 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM users
      WHERE email = $1
    `;
    const result = await this.getClient(client).query<User>(query, [email]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  async findById(id: string, client?: PoolClient): Promise<User | null> {
    const query = `
      SELECT 
        id, 
        email, 
        password_hash as "passwordHash", 
        role, 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM users
      WHERE id = $1
    `;
    const result = await this.getClient(client).query<User>(query, [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }
}
