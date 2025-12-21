import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';

@Injectable()
export class AuditInfrastructureRepository {
  constructor(private readonly db: DatabaseService) {}

  async createSemesterPartition(name: string, startDate: string, endDate: string): Promise<void> {
    const query = `SELECT audit.create_semester_partition($1, $2, $3)`;
    await this.db.query(query, [name, startDate, endDate]);
  }
}
