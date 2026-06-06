import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { RoomChangesService } from '../services/room-changes.service';
import { ResolveRoomChangeDto } from '../dto/resolve-room-change.dto';
import { StaffMoveBedDto } from '../dto/staff-move-bed.dto';
import { ApproveRoomChangePaymentDto } from '../dto/approve-room-change-payment.dto';

@UseGuards(AuthenticatedGuard, PermissionsGuard)
@Controller('room-changes')
export class RoomChangesController {
  constructor(private readonly roomChangesService: RoomChangesService) {}

  @RequirePermissions(PERMISSIONS.ROOM_CHANGES_VIEW)
  @Get()
  getAll(@Query('semesterId') semesterId?: string, @Query('status') status?: string) {
    return this.roomChangesService.getAll({
      semesterId: semesterId ? parseInt(semesterId, 10) : undefined,
      status,
    });
  }

  @RequirePermissions(PERMISSIONS.ROOM_CHANGES_MANAGE)
  @Patch(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveRoomChangeDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.roomChangesService.resolve(id, dto, context);
  }

  @RequirePermissions(PERMISSIONS.ROOM_CHANGES_APPROVE_PAYMENT)
  @Patch(':id/approve-payment')
  approvePayment(
    @Param('id') id: string,
    @Body() dto: ApproveRoomChangePaymentDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.roomChangesService.approvePayment(id, dto, context);
  }

  @RequirePermissions(PERMISSIONS.ROOM_CHANGES_MANAGE)
  @Get('bookings/:bookingId/available-beds')
  getAvailableBeds(@Param('bookingId') bookingId: string) {
    return this.roomChangesService.getAvailableBedsForBooking(bookingId);
  }

  @RequirePermissions(PERMISSIONS.ROOM_CHANGES_MANAGE)
  @Post('bookings/:bookingId/move-bed')
  staffMoveBed(
    @Param('bookingId') bookingId: string,
    @Body() dto: StaffMoveBedDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.roomChangesService.staffMoveBed(bookingId, dto, context);
  }
}
