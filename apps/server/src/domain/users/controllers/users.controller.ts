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
import { FindAllUsersDto } from '../dto/find-all-users.dto';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('users')
@UseGuards(AuthenticatedGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto, @UserContext() context: AuditUserContext) {
    return this.usersService.createUser(context, createUserDto);
  }

  @Get()
  findAll(@Query() query: FindAllUsersDto) {
    const { role, ...pagination } = query;
    return this.usersService.findAll(pagination, role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.usersService.updateUser(id, context, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.usersService.delete(id, context);
  }
}
