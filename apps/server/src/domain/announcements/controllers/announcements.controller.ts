import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AnnouncementsService } from '../services/announcements.service';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per file

@Controller('announcements')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  create(@Body() dto: CreateAnnouncementDto, @UserContext() ctx: AuditUserContext) {
    return this.service.create(dto, ctx.userId);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Post(':id/unpublish')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  unpublish(@Param('id') id: string) {
    return this.service.unpublish(id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // ─── Attachments ─────────────────────────────────────────────────────────────

  @Post(':id/attachments')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  @UseInterceptors(FilesInterceptor('attachments', 10, { limits: { fileSize: MAX_FILE_SIZE } }))
  uploadAttachments(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.service.uploadAttachments(id, files);
  }

  @Get(':id/attachments/:attachmentId')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  async downloadAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { data, filename, mimeType } = await this.service.downloadAttachment(id, attachmentId);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    return new StreamableFile(data);
  }

  @Delete(':id/attachments/:attachmentId')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAttachment(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.service.deleteAttachment(id, attachmentId);
  }
}
