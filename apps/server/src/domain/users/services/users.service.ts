import {
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersRepository } from '../repositories/users.repository';
import { AccessRepository } from '../repositories/access.repository';
import { User } from '../entities/user.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { PoolClient } from 'pg';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accessRepository: AccessRepository,
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
  ) {}

  private isAdmin(userOrContext: {
    isRecoveryAdmin?: boolean;
    roles?: { name: string }[];
  }): boolean {
    return (
      userOrContext.isRecoveryAdmin ||
      (userOrContext.roles?.some((r) => r.name === SYSTEM_ROLES.ADMIN) ?? false)
    );
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
      const createdUser = await this.usersRepository.create(
        {
          ...data,
          password: passwordHash,
          isRecoveryAdmin: false,
        },
        client,
      );

      if (data.roleIds && data.roleIds.length > 0) {
        for (const roleId of data.roleIds) {
          // Admin Protection: Only admins can assign the Admin role
          const role = await this.accessRepository.findRoleById(roleId, client);
          if (role && role.name === SYSTEM_ROLES.ADMIN && !this.isAdmin(context)) {
            throw new ForbiddenException('Only Administrators can assign the Admin role.');
          }
          await this.accessRepository.assignRoleToUser(createdUser.id, roleId, client);
        }
      }

      createdUser.roles = await this.accessRepository.getRolesForUser(createdUser.id, client);
      createdUser.permissions = await this.accessRepository.getPermissionsForUser(
        createdUser.id,
        client,
      );

      return createdUser;
    }, context);

    this.logger.log(`User created successfully with ID: ${user.id}`);
    return user;
  }

  async createRecoveryAdmin(context: AuditUserContext, data: CreateUserDto): Promise<User> {
    this.logger.log(`Attempting to create Recovery Admin with email: ${data.email}`);
    const existing = await this.usersRepository.findByEmail(data.email);
    if (existing) {
      this.logger.warn(`Recovery Admin creation failed: email ${data.email} already exists`);
      throw new ConflictException(`User with email ${data.email} already exists`);
    }

    const passwordHash = await argon2.hash(data.password);

    const user = await this.db.transaction(async (client) => {
      return this.usersRepository.create(
        {
          ...data,
          password: passwordHash,
          isRecoveryAdmin: true,
        },
        client,
      );
    }, context);

    this.logger.log(`Recovery Admin created successfully with ID: ${user.id}`);
    return user;
  }

  async updateUser(id: string, context: AuditUserContext, data: UpdateUserDto): Promise<User> {
    this.logger.log({ userId: id, data }, 'Attempting to update user');

    // Admin Visibility/Protection Check (handled by Repository + Service)
    const targetUser = await this.findById(id, context);
    if (!targetUser) throw new NotFoundException(`User with ID ${id} not found`);

    // Only Admin can modify another Admin
    if (this.isAdmin(targetUser) && !this.isAdmin(context)) {
      throw new ForbiddenException('You cannot modify an Administrator account.');
    }

    return this.db.transaction(async (client) => {
      const existing = await this.usersRepository.findById(id, client, false, context);
      if (!existing) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (existing.isRecoveryAdmin) {
        throw new ForbiddenException('Cannot modify the Recovery Admin account');
      }

      let passwordHash: string | undefined;
      if (data.password) {
        passwordHash = await argon2.hash(data.password);
      }

      const updated = await this.usersRepository.update(
        id,
        {
          email: data.email,
          isActive: data.isActive,
          passwordHash,
        },
        client,
      );

      if (!updated) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_USER,
          entityType: 'user',
          entityId: id,
          undoData: existing,
          description: `Updated user ${existing.email}`,
        },
        client,
      );

      this.logger.log({ userId: id }, 'User updated successfully');
      return updated;
    }, context);
  }

  async findAll(
    pagination: PaginationDto,
    context?: AuditUserContext,
  ): Promise<PaginatedResult<User>> {
    return this.usersRepository.findAll(pagination, undefined, context);
  }

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    const user = await this.usersRepository.findByEmail(email, undefined, includePassword);
    if (user) {
      user.roles = await this.accessRepository.getRolesForUser(user.id);
      user.permissions = await this.accessRepository.getPermissionsForUser(user.id);
    }
    return user;
  }

  async findById(id: string, context?: AuditUserContext): Promise<User | null> {
    const user = await this.usersRepository.findById(id, undefined, false, context);
    if (user) {
      user.roles = await this.accessRepository.getRolesForUser(user.id);
      user.permissions = await this.accessRepository.getPermissionsForUser(user.id);
    }
    return user;
  }

  async delete(id: string, context: AuditUserContext, externalClient?: PoolClient): Promise<void> {
    this.logger.log({ userId: id }, 'Attempting to delete user');

    const targetUser = await this.findById(id, context);
    if (!targetUser) throw new ConflictException(`User with ID ${id} not found`);

    // Only Admin can delete another Admin
    if (this.isAdmin(targetUser) && !this.isAdmin(context)) {
      throw new ForbiddenException('You cannot delete an Administrator account.');
    }

    const operation = async (client: PoolClient) => {
      const user = await this.usersRepository.findById(id, client, false, context);
      if (!user) {
        throw new ConflictException(`User with ID ${id} not found`);
      }

      if (user.isRecoveryAdmin) {
        throw new ForbiddenException('Cannot delete the Recovery Admin account');
      }

      const result = await this.usersRepository.delete(id, client);
      if (!result) {
        throw new ConflictException(`User with ID ${id} not found`);
      }

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.DELETE_USER,
          entityType: 'user',
          entityId: id,
          undoData: user,
          description: `Deleted user ${user.email}`,
        },
        client,
      );
    };

    if (externalClient) return operation(externalClient);

    await this.db.transaction(operation, context);
    this.logger.log({ userId: id }, 'User deleted successfully');
  }
}
