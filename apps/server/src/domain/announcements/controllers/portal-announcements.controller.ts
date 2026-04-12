import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from '../services/announcements.service';
import { StudentAuthGuard } from '../../../common/guards/student-auth.guard';

@Controller('portal/announcements')
@UseGuards(StudentAuthGuard)
export class PortalAnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  findPublished() {
    return this.service.findPublished();
  }
}
