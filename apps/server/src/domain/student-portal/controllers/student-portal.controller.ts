import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Request,
  Res,
  UseGuards,
  Patch,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { StudentPortalService } from '../services/student-portal.service';
import { StudentAuthGuard } from '../../../common/guards/student-auth.guard';
import { StudentLoginDto } from '../dto/student-login.dto';
import { UpdateStudentContactDto } from '../dto/update-student-contact.dto';
import { StudentCreateBookingDto } from '../dto/student-create-booking.dto';

@Controller('portal')
export class StudentPortalController {
  constructor(private readonly studentPortalService: StudentPortalService) {}

  // ─── Auth ────────────────────────────────────────────────────────────────────

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: StudentLoginDto, @Request() req: ExpressRequest) {
    const student = await this.studentPortalService.loginByStudentNumber(dto.studentNumber);
    req.session.studentId = student.id;
    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve())),
    );
    return student;
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: ExpressRequest, @Res() res: ExpressResponse) {
    delete req.session.studentId;
    req.session.save(() => res.status(HttpStatus.OK).send());
  }

  @UseGuards(StudentAuthGuard)
  @Get('auth/me')
  async getMe(@Request() req: ExpressRequest) {
    return this.studentPortalService.getProfile(req.session.studentId!);
  }

  // ─── Profile ─────────────────────────────────────────────────────────────────

  @UseGuards(StudentAuthGuard)
  @Get('me')
  async getProfile(@Request() req: ExpressRequest) {
    return this.studentPortalService.getProfile(req.session.studentId!);
  }

  @UseGuards(StudentAuthGuard)
  @Patch('me')
  async updateContact(@Request() req: ExpressRequest, @Body() dto: UpdateStudentContactDto) {
    return this.studentPortalService.updateContact(req.session.studentId!, dto);
  }

  // ─── Semesters ───────────────────────────────────────────────────────────────

  @UseGuards(StudentAuthGuard)
  @Get('semesters')
  async getBookableSemesters() {
    return this.studentPortalService.getBookableSemesters();
  }

  @UseGuards(StudentAuthGuard)
  @Get('semesters/:id/available-beds')
  async getAvailableBeds(
    @Param('id', ParseIntPipe) semesterId: number,
    @Request() req: ExpressRequest,
  ) {
    return this.studentPortalService.getAvailableBedsForSemester(
      semesterId,
      req.session.studentId!,
    );
  }

  // ─── Bookings ─────────────────────────────────────────────────────────────────

  @UseGuards(StudentAuthGuard)
  @Get('bookings')
  async getMyBookings(@Request() req: ExpressRequest) {
    return this.studentPortalService.getMyBookings(req.session.studentId!);
  }

  @UseGuards(StudentAuthGuard)
  @Get('bookings/current')
  async getCurrentBooking(@Request() req: ExpressRequest) {
    const booking = await this.studentPortalService.getCurrentBooking(req.session.studentId!);
    if (!booking) throw new NotFoundException('No active booking found');
    return booking;
  }

  @UseGuards(StudentAuthGuard)
  @Get('bookings/:id')
  async getBookingById(@Param('id') bookingId: string, @Request() req: ExpressRequest) {
    return this.studentPortalService.getBookingById(bookingId, req.session.studentId!);
  }

  @UseGuards(StudentAuthGuard)
  @Post('bookings')
  @HttpCode(HttpStatus.CREATED)
  async createBooking(@Body() dto: StudentCreateBookingDto, @Request() req: ExpressRequest) {
    return this.studentPortalService.createBooking(req.session.studentId!, dto);
  }

  // ─── Financial ───────────────────────────────────────────────────────────────

  @UseGuards(StudentAuthGuard)
  @Get('transactions')
  async getMyTransactions(@Request() req: ExpressRequest) {
    return this.studentPortalService.getMyTransactions(req.session.studentId!);
  }

  @UseGuards(StudentAuthGuard)
  @Get('damages')
  async getMyDamageLiabilities(@Request() req: ExpressRequest) {
    return this.studentPortalService.getMyDamageLiabilities(req.session.studentId!);
  }
}
