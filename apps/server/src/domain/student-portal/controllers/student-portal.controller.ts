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
  Query,
  Request,
  Res,
  StreamableFile,
  UseGuards,
  Patch,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { StudentPortalService } from '../services/student-portal.service';
import { ContractsService } from '../../contracts/services/contracts.service';
import { ContractType } from '../../../common/enums/contract-type.enum';
import { StudentAuthGuard } from '../../../common/guards/student-auth.guard';
import { StudentLoginDto } from '../dto/student-login.dto';
import { UpdateStudentContactDto } from '../dto/update-student-contact.dto';
import { StudentCreateBookingDto } from '../dto/student-create-booking.dto';

@Controller('portal')
export class StudentPortalController {
  constructor(
    private readonly studentPortalService: StudentPortalService,
    private readonly contractsService: ContractsService,
  ) {}

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
    @Query('roomTypeId') roomTypeId: string | undefined,
    @Request() req: ExpressRequest,
  ) {
    return this.studentPortalService.getAvailableBedsForSemester(
      semesterId,
      req.session.studentId!,
      roomTypeId ? parseInt(roomTypeId, 10) : null,
    );
  }

  @UseGuards(StudentAuthGuard)
  @Get('semesters/:id/buildings')
  async getBuildings(
    @Param('id', ParseIntPipe) semesterId: number,
    @Request() req: ExpressRequest,
  ) {
    return this.studentPortalService.getBuildings(semesterId, req.session.studentId!);
  }

  @UseGuards(StudentAuthGuard)
  @Get('semesters/:id/room-catalog')
  async getRoomCatalog(
    @Param('id', ParseIntPipe) semesterId: number,
    @Query('buildingId') buildingId: string | undefined,
    @Query('capacity') capacity: string | undefined,
    @Request() req: ExpressRequest,
  ) {
    return this.studentPortalService.getRoomCatalog(
      semesterId,
      req.session.studentId!,
      buildingId ? parseInt(buildingId, 10) : null,
      capacity ? parseInt(capacity, 10) : null,
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
  @Get('bookings/:id/contract')
  async downloadContract(
    @Param('id') bookingId: string,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    const booking = await this.studentPortalService.getBookingById(
      bookingId,
      req.session.studentId!,
    );
    if (!booking.contractSigned)
      throw new NotFoundException('No contract available for this booking');
    const contract = await this.contractsService.getContract(bookingId, ContractType.CHECK_IN);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contract-${bookingId}.pdf"`,
      'Content-Length': contract.fileSize,
    });
    return new StreamableFile(contract.pdfData);
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
