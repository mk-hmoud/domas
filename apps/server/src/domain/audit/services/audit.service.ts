import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { AuditInfrastructureRepository } from '../repositories/audit-infrastructure.repository';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';

@Injectable()
export class AuditService {
  constructor(
    private readonly auditInfrastructureRepository: AuditInfrastructureRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async createSemesterPartition(
    name: string,
    startDate: string,
    endDate: string,
    client?: PoolClient,
  ): Promise<void> {
    return this.auditInfrastructureRepository.createSemesterPartition(
      name,
      startDate,
      endDate,
      client,
    );
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
