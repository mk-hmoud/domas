import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AccessRepository } from '../repositories/access.repository';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { DatabaseService } from '../../../core/database/database.service';

import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class AccessService {
  private readonly logger = new Logger(AccessService.name);

  constructor(
    private readonly accessRepository: AccessRepository,
    private readonly db: DatabaseService,
  ) {}

  async findAllRoles(): Promise<Role[]> {
    const roles = await this.accessRepository.findAllRoles();
    // Ideally we should fetch permission count or list, but for list view usually basic info is enough.
    // If we want permissions, we can fetch them. Let's keep it simple for now.
    return roles;
  }

  async findRoleById(id: number): Promise<Role> {
    const role = await this.accessRepository.findRoleById(id);
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);

    role.permissions = await this.accessRepository.getPermissionsForRole(id);
    return role;
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.accessRepository.findAllPermissions();
  }

  async createRole(data: CreateRoleDto, context: AuditUserContext): Promise<Role> {
    this.logger.log({ role: data.name }, 'Creating new role');
    return this.db.transaction(async (client) => {
      const role = await this.accessRepository.createRole(
        data.name,
        data.description,
        false,
        client,
      );

      if (data.permissionIds && data.permissionIds.length > 0) {
        await this.accessRepository.assignPermissionsToRole(role.id, data.permissionIds, client);
      }

      role.permissions = await this.accessRepository.getPermissionsForRole(role.id, client);
      return role;
    }, context);
  }

  async updateRole(id: number, data: UpdateRoleDto, context: AuditUserContext): Promise<Role> {
    this.logger.log({ roleId: id }, 'Updating role');
    return this.db.transaction(async (client) => {
      const role = await this.accessRepository.findRoleById(id, client);
      if (!role) throw new NotFoundException(`Role with ID ${id} not found`);

      if (role.isSystemRole && data.name && data.name !== role.name) {
        // Prevent renaming system roles to avoid breaking code that relies on names
        // But allow updating description/permissions.
        // Actually, preventing any name change on system role is safer.
        //throw new NotFoundException('Cannot rename a System Role');
        throw new ForbiddenException('Cannot rename a System Role');
      }

      const updatedRole = await this.accessRepository.updateRole(
        id,
        { name: data.name, description: data.description },
        client,
      );

      if (data.permissionIds) {
        await this.accessRepository.replaceRolePermissions(id, data.permissionIds, client);
      }

      return this.findRoleById(id); // Re-fetch full object with permissions (via service method? No, loop issues. Use repo methods)
      // Actually inside transaction we should pass client to findRoleById logic if we extracted it.
      // Or just return updatedRole + fetch permissions.
      // Let's attach permissions manually to return full object.
      // But replaceRolePermissions happened.

      // Re-fetching inside transaction:
      const finalRole = await this.accessRepository.findRoleById(id, client);
      finalRole!.permissions = await this.accessRepository.getPermissionsForRole(id, client);
      return finalRole!;
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
