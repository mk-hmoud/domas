import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { StudentPortalService } from '../services/student-portal.service';
import { StudentAuthGuard } from '../guards/student-auth.guard';
import { StudentLoginDto } from '../dto/student-login.dto';
import { UpdateStudentContactDto } from '../dto/update-student-contact.dto';

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
}
