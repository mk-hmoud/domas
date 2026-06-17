import { Controller, Get, Param, Request, Res, StreamableFile, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { AnnouncementsService } from '../services/announcements.service';
import { StudentAuthGuard } from '../../../common/guards/student-auth.guard';

@Controller('portal/announcements')
@UseGuards(StudentAuthGuard)
export class PortalAnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  findPublished(@Request() req: ExpressRequest) {
    return this.service.findPublishedForStudent(req.session.studentId!);
  }

  @Get(':id/attachments/:attachmentId')
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
}
