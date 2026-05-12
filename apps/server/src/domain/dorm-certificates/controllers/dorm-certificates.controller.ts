import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { DormCertificatesService } from '../services/dorm-certificates.service';
import { ReviewDormCertificateDto } from '../dto/review-dorm-certificate.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('dorm-certificates')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class DormCertificatesController {
  constructor(private readonly dormCertificatesService: DormCertificatesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.STUDENTS_VIEW)
  listAll(@Query('status') status?: string) {
    return this.dormCertificatesService.listAll(status);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.STUDENTS_REVIEW_APPLICATIONS)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('certificate', { limits: { fileSize: 10 * 1024 * 1024 } }))
  approve(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @UserContext() context: AuditUserContext,
  ) {
    return this.dormCertificatesService.approve(id, context.userId, file);
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.STUDENTS_REVIEW_APPLICATIONS)
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @Body() dto: ReviewDormCertificateDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.dormCertificatesService.reject(id, context.userId, dto.rejectionReason ?? '');
  }
}
