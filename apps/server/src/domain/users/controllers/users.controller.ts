import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { FindAllUsersDto } from '../dto/find-all-users.dto';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('users')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_CREATE)
  create(@Body() createUserDto: CreateUserDto, @UserContext() context: AuditUserContext) {
    return this.usersService.createUser(context, createUserDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  findAll(@Query() query: FindAllUsersDto) {
    return this.usersService.findAll(query);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USERS_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.usersService.updateUser(id, context, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USERS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.usersService.delete(id, context);
  }
}
