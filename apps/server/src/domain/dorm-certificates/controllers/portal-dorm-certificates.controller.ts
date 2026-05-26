import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { DormCertificatesService } from '../services/dorm-certificates.service';
import { StudentAuthGuard } from '../../../common/guards/student-auth.guard';

@Controller('portal/dorm-certificate')
export class PortalDormCertificatesController {
  constructor(private readonly dormCertificatesService: DormCertificatesService) {}

  @UseGuards(StudentAuthGuard)
  @Get('eligibility')
  getEligibility(@Request() req: ExpressRequest) {
    return this.dormCertificatesService.getEligibility(req.session.studentId!);
  }

  @UseGuards(StudentAuthGuard)
  @Get('requests')
  getMyRequests(@Request() req: ExpressRequest) {
    return this.dormCertificatesService.getMyRequests(req.session.studentId!);
  }

  @UseGuards(StudentAuthGuard)
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('certificate', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async requestCertificate(
    @Request() req: ExpressRequest,
    @UploadedFile() file?: Express.Multer.File,
    @Body('expiryDate') expiryDate?: string,
  ) {
    const expiry = expiryDate ? new Date(expiryDate) : undefined;
    return this.dormCertificatesService.requestCertificate(req.session.studentId!, file, expiry);
  }
}
