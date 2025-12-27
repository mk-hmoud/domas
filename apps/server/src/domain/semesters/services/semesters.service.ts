import { Injectable, NotFoundException } from '@nestjs/common';
import { SemestersRepository } from '../repositories/semesters.repository';
import { CreateSemesterDto } from '../dto/create-semester.dto';
import { UpdateSemesterDto } from '../dto/update-semester.dto';
import { Semester } from '../entities/semester.entity';
import { AuditService } from '../../audit/services/audit.service';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Injectable()
export class SemestersService {
  constructor(
    private readonly semestersRepository: SemestersRepository,
    private readonly auditService: AuditService,
    private readonly db: DatabaseService,
  ) {}

  async create(data: CreateSemesterDto, context: AuditUserContext): Promise<Semester> {
    return this.db.transaction(async (client) => {
      //
      // **
      //    Commented out for now, as I'm not sure if it should be partitioned
      //    automatically on creation or should be more direct and intentional.
      // **
      //
      // Create audit partitions for the new semester
      //  await this.auditService.createSemesterPartition(
      //    data.name,
      //    data.startDate,
      //    data.endDate,
      //    client,
      //  );

      if (data.isActive) {
        await this.semestersRepository.deactivateAll(client);
      }
      return this.semestersRepository.create(data, client);
    }, context);
  }

  async findAll(): Promise<Semester[]> {
    return this.semestersRepository.findAll();
  }

  async findById(id: number): Promise<Semester> {
    const semester = await this.semestersRepository.findById(id);
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }
    return semester;
  }

  async update(id: number, data: UpdateSemesterDto, context: AuditUserContext): Promise<Semester> {
    return this.db.transaction(async (client) => {
      const semester = await this.semestersRepository.findById(id, client);
      if (!semester) {
        throw new NotFoundException(`Semester with ID ${id} not found`);
      }

      if (data.isActive) {
        await this.semestersRepository.deactivateAll(client);
      }

      const updated = await this.semestersRepository.update(id, data, client);
      if (!updated) {
        // Should not happen as we checked existence, unless deleted concurrently
        throw new NotFoundException(`Semester with ID ${id} not found`);
      }
      return updated;
    }, context);
  }

  async toggleActive(id: number, context: AuditUserContext): Promise<Semester> {
    return this.db.transaction(async (client) => {
      const semester = await this.semestersRepository.findById(id, client);
      if (!semester) {
        throw new NotFoundException(`Semester with ID ${id} not found`);
      }

      const newActiveStatus = !semester.isActive;

      if (newActiveStatus) {
        await this.semestersRepository.deactivateAll(client);
      }

      const updated = await this.semestersRepository.update(
        id,
        { isActive: newActiveStatus },
        client,
      );
      if (!updated) {
        throw new NotFoundException(`Semester with ID ${id} not found`);
      }
      return updated;
    }, context);
  }

  async delete(id: number, context: AuditUserContext): Promise<void> {
    return this.db.transaction(async (client) => {
      const deleted = await this.semestersRepository.delete(id, client);
      if (!deleted) {
        throw new NotFoundException(`Semester with ID ${id} not found`);
      }
    }, context);
  }
}
