import { Injectable, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersRepository } from '../repositories/users.repository';
import { User } from '../entities/user.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRole } from '../../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly db: DatabaseService,
  ) {}

  async existsByRole(role: UserRole): Promise<boolean> {
    return this.usersRepository.existsByRole(role);
  }

  async createUser(context: AuditUserContext, data: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException(`User with email ${data.email} already exists`);
    }

    const passwordHash = await argon2.hash(data.password);

    return this.db.transaction(async (client) => {
      return this.usersRepository.create(
        {
          ...data,
          passwordHash,
        },
        client,
      );
    }, context);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }
}
