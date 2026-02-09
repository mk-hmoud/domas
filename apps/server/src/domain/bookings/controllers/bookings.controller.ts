import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { ApproveFinancialsDto } from '../dto/approve-financials.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { CheckInBookingDto } from '../dto/check-in-booking.dto';

@Controller('bookings')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BOOKINGS_CREATE)
  create(@Body() createBookingDto: CreateBookingDto, @UserContext() context: AuditUserContext) {
    return this.bookingsService.create(createBookingDto, context);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BOOKINGS_VIEW)
  findAll(@Query('studentId') studentId?: string, @Query('status') status?: BookingOpsStatus) {
    return this.bookingsService.findAll({ studentId, status });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BOOKINGS_VIEW)
  findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Patch(':id/approve-financials')
  @RequirePermissions(PERMISSIONS.BOOKINGS_APPROVE_FINANCIAL)
  approveFinancials(
    @Param('id') id: string,
    @Body() approveFinancialsDto: ApproveFinancialsDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bookingsService.approveFinancials(id, approveFinancialsDto, context);
  }

  @Post(':id/check-in')
  @RequirePermissions(PERMISSIONS.BOOKINGS_CHECK_IN)
  @HttpCode(HttpStatus.OK)
  checkIn(
    @Param('id') id: string,
    @Body() data: CheckInBookingDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bookingsService.checkIn(id, data, context);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BOOKINGS_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bookingsService.update(id, updateBookingDto, context);
  }
}
