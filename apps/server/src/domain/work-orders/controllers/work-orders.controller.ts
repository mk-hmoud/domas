import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { WorkOrdersService } from '../services/work-orders.service';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { AssignWorkOrderDto } from '../dto/assign-work-order.dto';
import { UpdateWorkOrderStatusDto } from '../dto/update-work-order-status.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';
import { WorkOrderStatus } from '../../../common/enums/work-order-status.enum';
import { WorkOrderPriority } from '../../../common/enums/work-order-priority.enum';

@UseGuards(AuthenticatedGuard, PermissionsGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @RequirePermissions(PERMISSIONS.WORK_ORDERS_VIEW)
  @Get()
  getAll(
    @UserContext() context: AuditUserContext,
    @Query('status') status?: WorkOrderStatus,
    @Query('priority') priority?: WorkOrderPriority,
    @Query('locationId') locationId?: string,
  ) {
    return this.workOrdersService.getAll(
      {
        status,
        priority,
        locationId: locationId ? parseInt(locationId, 10) : undefined,
      },
      context,
    );
  }

  // Also usable by dorm staff triaging tickets (tickets.triage) to pick a technician on escalation.
  @RequirePermissions(PERMISSIONS.WORK_ORDERS_MANAGE, PERMISSIONS.TICKETS_TRIAGE)
  @Get('assignable-technicians')
  getAssignableTechnicians(@UserContext() context: AuditUserContext) {
    return this.workOrdersService.getAssignableTechnicians(context);
  }

  @RequirePermissions(PERMISSIONS.WORK_ORDERS_MANAGE)
  @Post()
  create(@Body() dto: CreateWorkOrderDto, @UserContext() context: AuditUserContext) {
    return this.workOrdersService.create(dto, context);
  }

  @RequirePermissions(PERMISSIONS.WORK_ORDERS_MANAGE)
  @Patch(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignWorkOrderDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.workOrdersService.assign(id, dto, context);
  }

  @RequirePermissions(PERMISSIONS.WORK_ORDERS_UPDATE, PERMISSIONS.WORK_ORDERS_MANAGE)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.workOrdersService.updateStatus(id, dto, context);
  }

  @RequirePermissions(PERMISSIONS.WORK_ORDERS_MANAGE)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.workOrdersService.update(id, dto, context);
  }
}
