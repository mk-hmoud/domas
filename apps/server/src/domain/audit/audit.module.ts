import { Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { AuditInfrastructureRepository } from './repositories/audit-infrastructure.repository';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { AuditController } from './controllers/audit.controller';

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditInfrastructureRepository, AuditLogsRepository],
  exports: [AuditService],
})
export class AuditModule {}
