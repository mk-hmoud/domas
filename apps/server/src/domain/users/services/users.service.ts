import { Injectable, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersRepository } from '../repositories/users.repository';
import { User } from '../entities/user.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly db: DatabaseService,
  ) {}

  async existsByRole(role: UserRole): Promise<boolean> {
    return this.usersRepository.existsByRole(role);
  }

  async createUser(context: AuditUserContext, data: CreateUserDto): Promise<User> {
    this.logger.log(`Attempting to create user with email: ${data.email}`);
    const existing = await this.usersRepository.findByEmail(data.email);
    if (existing) {
      this.logger.warn(`User creation failed: email ${data.email} already exists`);
      throw new ConflictException(`User with email ${data.email} already exists`);
    }

    const passwordHash = await argon2.hash(data.password);

    const user = await this.db.transaction(async (client) => {
      return this.usersRepository.create(
        {
          ...data,
          passwordHash,
        },
        client,
      );
    }, context);

    this.logger.log(`User created successfully with ID: ${user.id}`);
    return user;
  }

  async updateUser(id: string, context: AuditUserContext, data: UpdateUserDto): Promise<User> {
    this.logger.log({ userId: id, data }, 'Attempting to update user');

    return this.db.transaction(async (client) => {
      const existing = await this.usersRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      let passwordHash: string | undefined;
      if (data.password) {
        passwordHash = await argon2.hash(data.password);
      }

      const updated = await this.usersRepository.update(
        id,
        {
          email: data.email,
          role: data.role,
          isActive: data.isActive,
          passwordHash,
        },
        client,
      );

      if (!updated) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log({ userId: id }, 'User updated successfully');
      return updated;
    }, context);
  }

  async findAll(
    pagination: PaginationDto,
    role?: UserRole | UserRole[],
  ): Promise<PaginatedResult<User>> {
    return this.usersRepository.findAll(pagination, role);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async delete(id: string, context: AuditUserContext): Promise<void> {
    this.logger.log({ userId: id }, 'Attempting to delete user');
    const result = await this.db.transaction(async (client) => {
      const user = await this.usersRepository.findById(id, client);
      if (!user) {
        throw new ConflictException(`User with ID ${id} not found`);
      }
      return this.usersRepository.delete(id, client);
    }, context);

    if (!result) {
      throw new ConflictException(`User with ID ${id} not found`);
    }
    this.logger.log({ userId: id }, 'User deleted successfully');
  }
}
