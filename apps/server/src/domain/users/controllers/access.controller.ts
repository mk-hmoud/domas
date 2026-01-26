import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, Patch } from '@nestjs/common';
import { AccessService } from '../services/access.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('access')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get('roles')
  @RequirePermissions(PERMISSIONS.ROLES_VIEW)
  findAllRoles() {
    return this.accessService.findAllRoles();
  }

  @Get('roles/:id')
  @RequirePermissions(PERMISSIONS.ROLES_VIEW)
  findRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.accessService.findRoleById(id);
  }

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_VIEW)
  findAllPermissions() {
    return this.accessService.findAllPermissions();
  }

  @Post('roles')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  createRole(@Body() dto: CreateRoleDto, @UserContext() context: AuditUserContext) {
    return this.accessService.createRole(dto, context);
  }

  @Patch('roles/:id')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.accessService.updateRole(id, dto, context);
  }

  @Post('users/:userId/roles/:roleId')
  @RequirePermissions(PERMISSIONS.ROLES_ASSIGN)
  assignRole(
    @Param('userId') userId: string,
    @Param('roleId', ParseIntPipe) roleId: number,
    @UserContext() context: AuditUserContext,
  ) {
    return this.accessService.assignRoleToUser(userId, roleId, context);
  }
}
