import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { AccessRepository } from '../repositories/access.repository';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { Location } from '../../locations/entities/location.entity';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { DatabaseService } from '../../../core/database/database.service';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';

import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class AccessService {
  private readonly logger = new Logger(AccessService.name);

  constructor(
    private readonly accessRepository: AccessRepository,
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
    private readonly locationScopeService: LocationScopeService,
    @Inject(forwardRef(() => LocationsRepository))
    private readonly locationsRepository: LocationsRepository,
  ) {}

  private canViewRole(role: Role, context: AuditUserContext): boolean {
    if (context.isRecoveryAdmin) return true;
    const userPerms = new Set(context.permissions || []);
    return (role.permissions || []).every((p) => userPerms.has(p.slug));
  }

  async findAllRoles(context: AuditUserContext): Promise<Role[]> {
    const roles = await this.accessRepository.findAllRoles();
    return roles.filter((role) => this.canViewRole(role, context));
  }

  async findRoleById(id: number, context: AuditUserContext): Promise<Role> {
    const role = await this.accessRepository.findRoleById(id);
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);

    role.permissions = await this.accessRepository.getPermissionsForRole(id);

    if (!this.canViewRole(role, context)) {
      // Return 404 to prevent enumeration of roles the user cannot see
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

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

      // Re-fetching inside transaction:
      const finalRole = await this.accessRepository.findRoleById(id, client);
      finalRole!.permissions = await this.accessRepository.getPermissionsForRole(id, client);
      return finalRole!;
    }, context);
  }

  async assignRoleToUser(userId: string, roleId: number, context: AuditUserContext): Promise<void> {
    this.logger.log({ userId, roleId }, 'Assigning role to user');

    // Security Check: Subset Permission Logic
    // A user can only assign a role if they have ALL permissions that the role grants.
    if (!context.isRecoveryAdmin) {
      const rolePermissions = await this.accessRepository.getPermissionsForRole(roleId);
      const userPermissions = new Set(context.permissions || []);

      const missingPermissions = rolePermissions.filter((p) => !userPermissions.has(p.slug));

      if (missingPermissions.length > 0) {
        this.logger.warn(
          {
            userId: context.userId,
            roleId,
            missing: missingPermissions.map((p) => p.slug),
          },
          'Role assignment denied: User lacks necessary permissions',
        );
        throw new ForbiddenException(
          'You cannot assign a role that grants permissions you do not possess.',
        );
      }
    }

    await this.db.transaction(async (client) => {
      await this.accessRepository.assignRoleToUser(userId, roleId, client);
      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.ASSIGN_ROLE,
          entityType: 'user_role',
          entityId: userId,
          undoData: { roleId },
          description: `Assigned role ${roleId} to user ${userId}`,
        },
        client,
      );
    }, context);
  }

  async revokeRoleFromUser(
    userId: string,
    roleId: number,
    context: AuditUserContext,
  ): Promise<void> {
    this.logger.log({ userId, roleId }, 'Revoking role from user');

    // Security Check: Subset Permission Logic
    // A user can only revoke a role if they have ALL permissions that the role grants.
    if (!context.isRecoveryAdmin) {
      const rolePermissions = await this.accessRepository.getPermissionsForRole(roleId);
      const userPermissions = new Set(context.permissions || []);

      const missingPermissions = rolePermissions.filter((p) => !userPermissions.has(p.slug));

      if (missingPermissions.length > 0) {
        this.logger.warn(
          {
            userId: context.userId,
            roleId,
            missing: missingPermissions.map((p) => p.slug),
          },
          'Role revocation denied: User lacks necessary permissions',
        );
        throw new ForbiddenException(
          'You cannot revoke a role that grants permissions you do not possess.',
        );
      }
    }

    await this.db.transaction(async (client) => {
      await this.accessRepository.revokeRoleFromUser(userId, roleId, client);
      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.REVOKE_ROLE,
          entityType: 'user_role',
          entityId: userId,
          undoData: { roleId },
          description: `Revoked role ${roleId} from user ${userId}`,
        },
        client,
      );
    }, context);
  }

  async getRolesForUser(userId: string): Promise<Role[]> {
    return this.accessRepository.getRolesForUser(userId);
  }

  async deleteRole(id: number, context: AuditUserContext): Promise<void> {
    this.logger.log({ roleId: id }, 'Deleting role');
    await this.db.transaction(async (client) => {
      const role = await this.accessRepository.findRoleById(id, client);
      if (!role) throw new NotFoundException(`Role with ID ${id} not found`);

      if (role.isSystemRole) {
        throw new ForbiddenException('Cannot delete a System Role');
      }

      // Security Check: Subset Permission Logic
      role.permissions = await this.accessRepository.getPermissionsForRole(id, client);
      if (!this.canViewRole(role, context)) {
        throw new ForbiddenException(
          'You cannot delete a role that grants permissions you do not possess.',
        );
      }

      await this.accessRepository.deleteRole(id, client);
    }, context);
  }

  async assignLocationToUser(
    userId: string,
    locationId: number,
    context: AuditUserContext,
  ): Promise<void> {
    this.logger.log({ userId, locationId }, 'Assigning location to user');

    const location = await this.locationsRepository.findById(locationId);
    if (!location) throw new NotFoundException(`Location with ID ${locationId} not found`);

    // A staff member can only grant location access within their own scope -
    // mirrors the subset-permission logic used for role assignment, so a
    // building-scoped manager can't extend reach beyond their own building.
    this.locationScopeService.assertAccess(context.locationScope, location.treePath);

    await this.db.transaction(async (client) => {
      await this.accessRepository.assignLocationToUser(userId, locationId, context.userId, client);
      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.ASSIGN_STAFF_LOCATION,
          entityType: 'staff_location',
          entityId: userId,
          undoData: { locationId },
          description: `Assigned location ${locationId} to user ${userId}`,
        },
        client,
      );
    }, context);
  }

  async revokeLocationFromUser(
    userId: string,
    locationId: number,
    context: AuditUserContext,
  ): Promise<void> {
    this.logger.log({ userId, locationId }, 'Revoking location from user');

    const location = await this.locationsRepository.findById(locationId);
    if (!location) throw new NotFoundException(`Location with ID ${locationId} not found`);

    this.locationScopeService.assertAccess(context.locationScope, location.treePath);

    await this.db.transaction(async (client) => {
      await this.accessRepository.revokeLocationFromUser(userId, locationId, client);
      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.REVOKE_STAFF_LOCATION,
          entityType: 'staff_location',
          entityId: userId,
          undoData: { locationId },
          description: `Revoked location ${locationId} from user ${userId}`,
        },
        client,
      );
    }, context);
  }

  async getLocationsForUser(userId: string): Promise<Location[]> {
    return this.accessRepository.getLocationsForUser(userId);
  }

  async getStaffForLocation(locationId: number): Promise<string[]> {
    return this.accessRepository.getStaffForLocation(locationId);
  }
}
