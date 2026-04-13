import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('stats')
@UseGuards(AuthenticatedGuard)
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('dashboard')
  getDashboard(@UserContext() context: AuditUserContext) {
    return this.service.getDashboard(context.permissions ?? []);
  }
}
