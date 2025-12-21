import { Injectable } from '@nestjs/common';
import { AuditInfrastructureRepository } from '../repositories/audit-infrastructure.repository';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';

@Injectable()
export class AuditService {
  constructor(
    private readonly auditInfrastructureRepository: AuditInfrastructureRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async createSemesterPartition(name: string, startDate: string, endDate: string): Promise<void> {
    return this.auditInfrastructureRepository.createSemesterPartition(name, startDate, endDate);
  }

  async getRecentChanges(limit?: number) {
    return this.auditLogsRepository.getRecentChanges(limit);
  }

  async getSuspiciousActivity() {
    return this.auditLogsRepository.getSuspiciousActivity();
  }

  async getBulkOperations(limit?: number) {
    return this.auditLogsRepository.getBulkOperations(limit);
  }
}
