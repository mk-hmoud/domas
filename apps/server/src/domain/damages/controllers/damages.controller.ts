import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DamagesService } from '../services/damages.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { CreateDamageReportDto } from '../dto/create-damage-report.dto';
import { DamageStatus } from '../../../common/enums/damage-status.enum';

@Controller('damages')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class DamagesController {
  constructor(private readonly service: DamagesService) {}

  @Post('reports')
  @RequirePermissions(PERMISSIONS.DAMAGES_REPORT)
  createReport(@Body() data: CreateDamageReportDto, @UserContext() context: AuditUserContext) {
    return this.service.createReport(data, context);
  }

  @Get('reports/:id')
  @RequirePermissions(PERMISSIONS.DAMAGES_VIEW)
  findReportById(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.service.findReportById(id, context);
  }

  @Get('reports')
  @RequirePermissions(PERMISSIONS.DAMAGES_VIEW)
  findAllReports(
    @UserContext() context: AuditUserContext,
    @Query('status') status?: DamageStatus,
    @Query('locationId') locationId?: string,
  ) {
    return this.service.findAllReports(
      {
        status,
        locationId: locationId ? parseInt(locationId, 10) : undefined,
      },
      context,
    );
  }

  @Post('reports/:id/approve')
  @RequirePermissions(PERMISSIONS.DAMAGES_MANAGE)
  approveReport(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.service.approveReport(id, context);
  }

  @Post('reports/:id/reject')
  @RequirePermissions(PERMISSIONS.DAMAGES_MANAGE)
  rejectReport(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.service.rejectReport(id, context);
  }

  // ─── Images ──────────────────────────────────────────────────────────────────

  @Post('reports/:id/images')
  @RequirePermissions(PERMISSIONS.DAMAGES_REPORT)
  @UseInterceptors(FilesInterceptor('images', 10, { limits: { fileSize: 20 * 1024 * 1024 } }))
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @UserContext() context: AuditUserContext,
  ) {
    return this.service.addImages(id, files, context);
  }

  @Get('reports/:id/images/:imageId/url')
  @RequirePermissions(PERMISSIONS.DAMAGES_VIEW)
  getImageUrl(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @UserContext() context: AuditUserContext,
  ) {
    return this.service.getImageUrl(id, imageId, context);
  }

  @Delete('reports/:id/images/:imageId')
  @RequirePermissions(PERMISSIONS.DAMAGES_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @UserContext() context: AuditUserContext,
  ) {
    return this.service.deleteImage(id, imageId, context);
  }
}
