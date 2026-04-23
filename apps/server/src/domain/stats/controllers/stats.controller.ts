import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('stats')
@UseGuards(AuthenticatedGuard)
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('dashboard')
  @Header('Cache-Control', 'no-store')
  getDashboard(@UserContext() context: AuditUserContext) {
    return this.service.getDashboard(context.permissions ?? [], context.isRecoveryAdmin);
  }

  @Get('rector')
  @Header('Cache-Control', 'no-store')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS.RECTOR_VIEW)
  getRectorDashboard() {
    return this.service.getRectorDashboard();
  }
}
