import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  approve(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.dormCertificatesService.approve(id, context.userId);
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
