import { Module, forwardRef } from '@nestjs/common';
import { StudentsModule } from '../students/students.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { RoomChangesService } from './services/room-changes.service';
import { RoomChangesRepository } from './repositories/room-changes.repository';
import { RoomChangesController } from './controllers/room-changes.controller';
import { PortalRoomChangesController } from './controllers/portal-room-changes.controller';

@Module({
  imports: [StudentsModule, NotificationsModule, forwardRef(() => AuditModule)],
  controllers: [RoomChangesController, PortalRoomChangesController],
  providers: [RoomChangesService, RoomChangesRepository],
  exports: [RoomChangesService],
})
export class RoomChangesModule {}
