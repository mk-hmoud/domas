import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AnnouncementsRepository } from './repositories/announcements.repository';
import { AnnouncementsService } from './services/announcements.service';
import { AnnouncementsController } from './controllers/announcements.controller';
import { PortalAnnouncementsController } from './controllers/portal-announcements.controller';

@Module({
  imports: [forwardRef(() => AuditModule)],
  controllers: [AnnouncementsController, PortalAnnouncementsController],
  providers: [AnnouncementsService, AnnouncementsRepository],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
