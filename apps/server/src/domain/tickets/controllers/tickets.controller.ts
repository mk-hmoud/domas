import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { TicketsService } from '../services/tickets.service';
import { ResolveTicketDto } from '../dto/resolve-ticket.dto';
import { RejectTicketDto } from '../dto/reject-ticket.dto';
import { EscalateTicketDto } from '../dto/escalate-ticket.dto';
import { TicketStatus } from '../../../common/enums/ticket-status.enum';
import { TicketCategory } from '../../../common/enums/ticket-category.enum';

@UseGuards(AuthenticatedGuard, PermissionsGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  @Get()
  getAll(
    @UserContext() context: AuditUserContext,
    @Query('status') status?: TicketStatus,
    @Query('category') category?: TicketCategory,
  ) {
    return this.ticketsService.getAll({ status, category }, context);
  }

  @RequirePermissions(PERMISSIONS.TICKETS_TRIAGE)
  @Patch(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveTicketDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.ticketsService.resolve(id, dto, context);
  }

  @RequirePermissions(PERMISSIONS.TICKETS_TRIAGE)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectTicketDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.ticketsService.reject(id, dto, context);
  }

  @RequirePermissions(PERMISSIONS.TICKETS_TRIAGE)
  @Patch(':id/escalate')
  escalate(
    @Param('id') id: string,
    @Body() dto: EscalateTicketDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.ticketsService.escalate(id, dto, context);
  }
}
