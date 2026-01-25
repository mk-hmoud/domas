import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AccessService } from '../services/access.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('access')
@UseGuards(AuthenticatedGuard)
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get('roles')
  findAllRoles() {
    return this.accessService.findAllRoles();
  }

  @Get('permissions')
  findAllPermissions() {
    return this.accessService.findAllPermissions();
  }

  @Post('roles')
  createRole(@Body() dto: CreateRoleDto, @UserContext() context: AuditUserContext) {
    return this.accessService.createRole(dto.name, dto.description || '', context);
  }

  @Post('users/:userId/roles/:roleId')
  assignRole(
    @Param('userId') userId: string,
    @Param('roleId', ParseIntPipe) roleId: number,
    @UserContext() context: AuditUserContext,
  ) {
    return this.accessService.assignRoleToUser(userId, roleId, context);
  }
}
