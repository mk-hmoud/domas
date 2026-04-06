import { Module } from '@nestjs/common';
import { StudentsModule } from '../students/students.module';
import { StudentPortalService } from './services/student-portal.service';
import { StudentPortalController } from './controllers/student-portal.controller';
import { StudentPortalRepository } from './repositories/student-portal.repository';

@Module({
  imports: [StudentsModule],
  controllers: [StudentPortalController],
  providers: [StudentPortalService, StudentPortalRepository],
  exports: [StudentPortalService],
})
export class StudentPortalModule {}
