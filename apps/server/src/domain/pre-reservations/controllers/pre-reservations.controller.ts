import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { PreReservationsService } from '../services/pre-reservations.service';
import { AssignPreReservationDto } from '../dto/assign-pre-reservation.dto';
import { RejectPreReservationDto } from '../dto/reject-pre-reservation.dto';

@UseGuards(AuthenticatedGuard, PermissionsGuard)
@Controller('pre-reservations')
export class PreReservationsController {
  constructor(private readonly preReservationsService: PreReservationsService) {}

  @RequirePermissions(PERMISSIONS.PRE_RESERVATIONS_VIEW)
  @Get()
  getAll(@Query('semesterId') semesterId?: string, @Query('status') status?: string) {
    return this.preReservationsService.getAll({
      semesterId: semesterId ? parseInt(semesterId, 10) : undefined,
      status,
    });
  }

  @RequirePermissions(PERMISSIONS.PRE_RESERVATIONS_MANAGE)
  @Get('available-beds')
  getAvailableBeds(
    @Query('semesterId', ParseIntPipe) semesterId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.preReservationsService.getAvailableBeds(semesterId, startDate, endDate);
  }

  @RequirePermissions(PERMISSIONS.PRE_RESERVATIONS_MANAGE)
  @Patch(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignPreReservationDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.preReservationsService.assign(id, dto, context);
  }

  @RequirePermissions(PERMISSIONS.PRE_RESERVATIONS_MANAGE)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectPreReservationDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.preReservationsService.reject(id, dto, context);
  }
}
