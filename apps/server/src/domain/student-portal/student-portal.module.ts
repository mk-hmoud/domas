import { Module } from '@nestjs/common';
import { StudentsModule } from '../students/students.module';
import { StudentPortalService } from './services/student-portal.service';
import { StudentPortalController } from './controllers/student-portal.controller';

@Module({
  imports: [StudentsModule],
  controllers: [StudentPortalController],
  providers: [StudentPortalService],
  exports: [StudentPortalService],
})
export class StudentPortalModule {}
