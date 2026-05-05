import { Module, forwardRef } from '@nestjs/common';
import { StudentsService } from './services/students.service';
import { StudentsController } from './controllers/students.controller';
import { StudentsRepository } from './repositories/students.repository';
import { StudentApplicationsRepository } from '../student-portal/repositories/student-applications.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [forwardRef(() => AuditModule)],
  controllers: [StudentsController],
  providers: [StudentsService, StudentsRepository, StudentApplicationsRepository],
  exports: [StudentsService, StudentsRepository],
})
export class StudentsModule {}
