import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { GuestsService } from '../services/guests.service';
import { CreateGuestDto } from '../dto/create-guest.dto';
import { UpdateGuestDto } from '../dto/update-guest.dto';
import { CreateGuestStayDto } from '../dto/create-guest-stay.dto';
import { UpdateGuestStayDto } from '../dto/update-guest-stay.dto';

@Controller()
@UseGuards(AuthenticatedGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.GUESTS_MANAGE)
export class GuestsController {
  constructor(private readonly service: GuestsService) {}

  // ─── Guests ───────────────────────────────────────────────────────────────

  @Get('guests')
  findAllGuests(@Query('search') search?: string) {
    return this.service.findAllGuests(search);
  }

  @Get('guests/by-id-number/:idNumber')
  findByIdNumber(@Param('idNumber') idNumber: string) {
    return this.service.findGuestByIdNumber(idNumber);
  }

  @Get('guests/:id')
  findGuest(@Param('id') id: string) {
    return this.service.findGuestById(id);
  }

  @Post('guests')
  createGuest(@Body() dto: CreateGuestDto) {
    return this.service.createGuest(dto);
  }

  @Patch('guests/:id')
  updateGuest(@Param('id') id: string, @Body() dto: UpdateGuestDto) {
    return this.service.updateGuest(id, dto);
  }

  // ─── Guest Stays ──────────────────────────────────────────────────────────

  @Get('guest-stays')
  findAllStays(
    @Query('status') status: string | undefined,
    @Query('upcoming') upcoming: string | undefined,
    @Query('bedId') bedId: string | undefined,
    @UserContext() context: AuditUserContext,
  ) {
    return this.service.findAllStays(
      {
        status,
        upcoming: upcoming === 'true',
        bedId: bedId ? Number(bedId) : undefined,
      },
      context,
    );
  }

  @Get('guest-stays/:id')
  findStay(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.service.findStayById(id, context);
  }

  @Post('guest-stays')
  createStay(@Body() dto: CreateGuestStayDto, @UserContext() context: AuditUserContext) {
    return this.service.createStay(dto, context);
  }

  @Patch('guest-stays/:id')
  updateStay(
    @Param('id') id: string,
    @Body() dto: UpdateGuestStayDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.service.updateStay(id, dto, context);
  }

  @Post('guest-stays/:id/check-in')
  checkIn(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.service.checkIn(id, context);
  }

  @Post('guest-stays/:id/check-out')
  checkOut(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.service.checkOut(id, context);
  }

  @Post('guest-stays/:id/cancel')
  cancel(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.service.cancel(id, context);
  }
}
