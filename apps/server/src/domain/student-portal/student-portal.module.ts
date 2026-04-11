import { Module } from '@nestjs/common';
import { StudentsModule } from '../students/students.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContractsModule } from '../contracts/contracts.module';
import { StudentPortalService } from './services/student-portal.service';
import { StudentPortalController } from './controllers/student-portal.controller';
import { StudentPortalRepository } from './repositories/student-portal.repository';

@Module({
  imports: [StudentsModule, NotificationsModule, ContractsModule],
  controllers: [StudentPortalController],
  providers: [StudentPortalService, StudentPortalRepository],
  exports: [StudentPortalService],
})
export class StudentPortalModule {}
