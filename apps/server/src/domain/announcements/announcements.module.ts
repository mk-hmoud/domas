import { Module } from '@nestjs/common';
import { AnnouncementsRepository } from './repositories/announcements.repository';
import { AnnouncementsService } from './services/announcements.service';
import { AnnouncementsController } from './controllers/announcements.controller';
import { PortalAnnouncementsController } from './controllers/portal-announcements.controller';

@Module({
  controllers: [AnnouncementsController, PortalAnnouncementsController],
  providers: [AnnouncementsService, AnnouncementsRepository],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
