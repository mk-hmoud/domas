import { Controller, Get, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AccountService } from '../services/account.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { UpdateProfileDto, ChangePasswordDto } from '../dto/account.dto';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('account')
@UseGuards(AuthenticatedGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  getProfile(@UserContext() context: AuditUserContext) {
    return this.accountService.getProfile(context.userId);
  }

  @Patch('profile')
  updateProfile(@Body() dto: UpdateProfileDto, @UserContext() context: AuditUserContext) {
    return this.accountService.updateProfile(context.userId, dto, context);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@Body() dto: ChangePasswordDto, @UserContext() context: AuditUserContext) {
    return this.accountService.changePassword(context.userId, dto, context);
  }
}
