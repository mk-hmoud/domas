import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PoolClient } from 'pg';
import { AuditInfrastructureRepository } from '../repositories/audit-infrastructure.repository';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';
import { SearchAuditDto } from '../dto/search-audit.dto';

@Injectable()
export class AuditService implements OnModuleInit {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditInfrastructureRepository: AuditInfrastructureRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing audit partitions...');
    try {
      await this.maintainPartitions();
      this.logger.log('Audit partitions verified/created successfully');
    } catch (error) {
      this.logger.error('Failed to maintain audit partitions', error);
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyMaintenance() {
    this.logger.log('Running monthly audit maintenance...');
    try {
      await this.maintainPartitions();
      await this.archiveOldPartitions();
      this.logger.log('Monthly audit maintenance completed successfully');
    } catch (error) {
      this.logger.error('Monthly audit maintenance failed', error);
    }
  }

  async search(dto: SearchAuditDto) {
    return this.auditLogsRepository.search(dto);
  }

  async maintainPartitions(client?: PoolClient): Promise<void> {
    return this.auditInfrastructureRepository.maintainPartitions(client);
  }

  async archiveOldPartitions(client?: PoolClient): Promise<void> {
    return this.auditInfrastructureRepository.archiveOldPartitions(client);
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
