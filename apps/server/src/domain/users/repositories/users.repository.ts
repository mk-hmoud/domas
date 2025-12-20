import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string): Promise<User | null> {
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
    const result = await this.db.query<User>(query, [email]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
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
    const result = await this.db.query<User>(query, [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }
}
