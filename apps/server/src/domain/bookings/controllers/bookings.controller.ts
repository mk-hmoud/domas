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
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';

@Controller('bookings')
@UseGuards(AuthenticatedGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @UserContext() context: AuditUserContext) {
    return this.bookingsService.create(createBookingDto, context);
  }

  @Get()
  findAll(@Query('studentId') studentId?: string, @Query('status') status?: BookingOpsStatus) {
    return this.bookingsService.findAll({ studentId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Patch(':id/approve-financials')
  approveFinancials(
    @Param('id') id: string,
    @Body() approveFinancialsDto: ApproveFinancialsDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bookingsService.approveFinancials(id, approveFinancialsDto, context);
  }

  @Post(':id/check-in')
  @HttpCode(HttpStatus.OK)
  checkIn(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.bookingsService.checkIn(id, context);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bookingsService.update(id, updateBookingDto, context);
  }
}
