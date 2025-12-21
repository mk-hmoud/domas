import { Module } from '@nestjs/common';
import { SemestersService } from './services/semesters.service';
import { SemestersController } from './controllers/semesters.controller';
import { SemestersRepository } from './repositories/semesters.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [SemestersController],
  providers: [SemestersService, SemestersRepository],
  exports: [SemestersService],
})
export class SemestersModule {}
