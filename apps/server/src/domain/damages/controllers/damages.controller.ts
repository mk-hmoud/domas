import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DamagesService } from '../services/damages.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { CreateDamageReportDto } from '../dto/create-damage-report.dto';
import { DamageStatus } from '../../../common/enums/damage-status.enum';

@Controller('damages')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class DamagesController {
  constructor(private readonly service: DamagesService) {}

  @Post('reports')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  createReport(@Body() data: CreateDamageReportDto, @UserContext() context: AuditUserContext) {
    return this.service.createReport(data, context);
  }

  @Get('reports/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_VIEW)
  findReportById(@Param('id') id: string) {
    return this.service.findReportById(id);
  }

  @Get('reports')
  @RequirePermissions(PERMISSIONS.INVENTORY_VIEW)
  findAllReports(@Query('status') status?: DamageStatus, @Query('locationId') locationId?: string) {
    return this.service.findAllReports({
      status,
      locationId: locationId ? parseInt(locationId, 10) : undefined,
    });
  }

  @Post('reports/:id/approve')
  @RequirePermissions(PERMISSIONS.BOOKINGS_APPROVE_FINANCIAL)
  approveReport(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.service.approveReport(id, context);
  }

  @Post('reports/:id/reject')
  @RequirePermissions(PERMISSIONS.BOOKINGS_APPROVE_FINANCIAL)
  rejectReport(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.service.rejectReport(id, context);
  }
}
