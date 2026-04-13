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
import { UpdateBookingDatesDto } from '../dto/update-booking-dates.dto';
import { TransferBookingDto } from '../dto/transfer-booking.dto';
import { BulkTransferBookingDto } from '../dto/bulk-transfer-booking.dto';
import { ApproveFinancialsDto } from '../dto/approve-financials.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { CheckInBookingDto } from '../dto/check-in-booking.dto';
import { CheckOutBookingDto } from '../dto/check-out-booking.dto';

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
  findAll(
    @Query('studentId') studentId?: string,
    @Query('status') status?: BookingOpsStatus,
    @Query('semesterId') semesterId?: string,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('locationId') locationId?: string,
    @Query('bedId') bedId?: string,
  ) {
    return this.bookingsService.findAll({
      studentId,
      status,
      paymentStatus,
      semesterId: semesterId ? parseInt(semesterId, 10) : undefined,
      locationId: locationId ? parseInt(locationId, 10) : undefined,
      bedId: bedId ? parseInt(bedId, 10) : undefined,
    });
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

  @Post(':id/check-out')
  @RequirePermissions(PERMISSIONS.BOOKINGS_UPDATE)
  @HttpCode(HttpStatus.OK)
  checkOut(
    @Param('id') id: string,
    @Body() data: CheckOutBookingDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bookingsService.checkOut(id, data, context);
  }

  @Post(':id/transfer')
  @RequirePermissions(PERMISSIONS.BOOKINGS_CREATE)
  transfer(
    @Param('id') id: string,
    @Body() dto: TransferBookingDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bookingsService.transfer(id, dto, context);
  }

  @Post('bulk-transfer')
  @RequirePermissions(PERMISSIONS.BOOKINGS_CREATE)
  transferMany(@Body() dto: BulkTransferBookingDto, @UserContext() context: AuditUserContext) {
    return this.bookingsService.transferMany(dto, context);
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

  @Patch(':id/dates')
  @RequirePermissions(PERMISSIONS.BOOKINGS_UPDATE)
  adjustDates(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDatesDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bookingsService.adjustDates(id, dto, context);
  }
}
