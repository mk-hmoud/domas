import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AccessRepository } from '../repositories/access.repository';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { DatabaseService } from '../../../core/database/database.service';

@Injectable()
export class AccessService {
  private readonly logger = new Logger(AccessService.name);

  constructor(
    private readonly accessRepository: AccessRepository,
    private readonly db: DatabaseService,
  ) {}

  async findAllRoles(): Promise<Role[]> {
    return this.accessRepository.findAllRoles();
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.accessRepository.findAllPermissions();
  }

  async createRole(name: string, description: string, context: AuditUserContext): Promise<Role> {
    this.logger.log({ role: name }, 'Creating new role');
    return this.db.transaction(async (client) => {
      return this.accessRepository.createRole(name, description, false, client);
    }, context);
  }

  async assignRoleToUser(userId: string, roleId: number, context: AuditUserContext): Promise<void> {
    this.logger.log({ userId, roleId }, 'Assigning role to user');
    await this.db.transaction(async (client) => {
      await this.accessRepository.assignRoleToUser(userId, roleId, client);
    }, context);
  }

  async getRolesForUser(userId: string): Promise<Role[]> {
    return this.accessRepository.getRolesForUser(userId);
  }
}
