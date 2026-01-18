import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SemestersRepository } from '../repositories/semesters.repository';
import { CreateSemesterDto } from '../dto/create-semester.dto';
import { UpdateSemesterDto } from '../dto/update-semester.dto';
import { Semester } from '../entities/semester.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { SemesterStatus } from '../../../common/enums/semester-status.enum';
import { BookingsRepository } from '../../bookings/repositories/bookings.repository';

@Injectable()
export class SemestersService {
  constructor(
    private readonly semestersRepository: SemestersRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly db: DatabaseService,
  ) {}

  private async validateStatusTransition(
    currentStatus: SemesterStatus,
    newStatus: SemesterStatus,
    semesterId: number,
  ) {
    if (currentStatus === newStatus) return;

    if (currentStatus === SemesterStatus.ARCHIVED) {
      throw new BadRequestException('Archived semesters cannot change status');
    }

    const validTransitions: Partial<Record<SemesterStatus, SemesterStatus[]>> = {
      [SemesterStatus.PLANNED]: [SemesterStatus.OPEN],
      [SemesterStatus.OPEN]: [SemesterStatus.ACTIVE, SemesterStatus.PLANNED],
      [SemesterStatus.ACTIVE]: [SemesterStatus.CLOSED],
      [SemesterStatus.CLOSED]: [SemesterStatus.ARCHIVED],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }

    // Special Rule: OPEN -> PLANNED requires 0 bookings
    if (currentStatus === SemesterStatus.OPEN && newStatus === SemesterStatus.PLANNED) {
      const count = await this.bookingsRepository.countBySemester(semesterId);
      if (count > 0) {
        throw new BadRequestException('Cannot revert to PLANNED because bookings exist');
      }
    }
  }

  private async validateModifications(current: Semester, dto: UpdateSemesterDto) {
    if (current.status === SemesterStatus.ARCHIVED) {
      throw new BadRequestException('Archived semesters cannot be modified');
    }

    // Status Transition Check
    if (dto.status) {
      await this.validateStatusTransition(current.status, dto.status, current.id);
    }

    // Identity Lock: Type and Academic Year cannot change unless PLANNED
    if (current.status !== SemesterStatus.PLANNED) {
      if (dto.type || dto.academicYear) {
        throw new BadRequestException(
          'Cannot change Type or Academic Year once semester is Open/Active',
        );
      }
    }

    // Financial Lock: Check if bookings exist if OPEN, or lock if ACTIVE/CLOSED
    const financialFields = ['depositAmountTry', 'depositAmountForeign', 'foreignCurrencyCode'];
    const hasFinancialChanges = financialFields.some(
      (field) => dto[field as keyof UpdateSemesterDto] !== undefined,
    );

    if (hasFinancialChanges) {
      if (current.status === SemesterStatus.ACTIVE || current.status === SemesterStatus.CLOSED) {
        throw new BadRequestException('Cannot change financials for Active/Closed semesters');
      }

      if (current.status === SemesterStatus.OPEN) {
        const bookingCount = await this.bookingsRepository.countBySemester(current.id);
        if (bookingCount > 0) {
          throw new BadRequestException(
            `Cannot change financials: ${bookingCount} bookings already exist for this semester`,
          );
        }
      }
    }

    // Date Constraints: Cannot change Start Date if ACTIVE
    if (current.status === SemesterStatus.ACTIVE && dto.startDate) {
      throw new BadRequestException('Cannot change Start Date of an Active semester');
    }
  }

  async create(data: CreateSemesterDto, context: AuditUserContext): Promise<Semester> {
    return this.db.transaction(async (client) => {
      // If setting to active, close others first
      if (data.status === SemesterStatus.ACTIVE) {
        await this.semestersRepository.deactivateAll(client);
      }
      return this.semestersRepository.create(data, client);
    }, context);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Semester>> {
    return this.semestersRepository.findAll(pagination);
  }

  async findById(id: number): Promise<Semester> {
    const semester = await this.semestersRepository.findById(id);
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }
    return semester;
  }

  async update(id: number, data: UpdateSemesterDto, context: AuditUserContext): Promise<Semester> {
    // Perform validation logic before transaction to save DB resources
    const current = await this.findById(id);
    await this.validateModifications(current, data);

    return this.db.transaction(async (client) => {
      if (data.status === SemesterStatus.ACTIVE) {
        await this.semestersRepository.deactivateAll(client);
      }

      const updated = await this.semestersRepository.update(id, data, client);
      if (!updated) {
        throw new NotFoundException(`Semester with ID ${id} not found`);
      }
      return updated;
    }, context);
  }

  async updateStatus(
    id: number,
    status: SemesterStatus,
    context: AuditUserContext,
  ): Promise<Semester> {
    const current = await this.findById(id);
    await this.validateStatusTransition(current.status, status, id);

    return this.db.transaction(async (client) => {
      if (status === SemesterStatus.ACTIVE) {
        await this.semestersRepository.deactivateAll(client);
      }

      const updated = await this.semestersRepository.update(id, { status }, client);
      if (!updated) {
        throw new NotFoundException(`Semester with ID ${id} not found`);
      }
      return updated;
    }, context);
  }

  async delete(id: number, context: AuditUserContext): Promise<void> {
    const semester = await this.findById(id);
    if (semester.status !== SemesterStatus.PLANNED) {
      throw new BadRequestException('Only PLANNED semesters can be deleted');
    }

    const bookingCount = await this.bookingsRepository.countBySemester(id);
    if (bookingCount > 0) {
      throw new BadRequestException(
        `Cannot delete semester: ${bookingCount} bookings depend on it. Delete bookings first.`,
      );
    }

    return this.db.transaction(async (client) => {
      const deleted = await this.semestersRepository.delete(id, client);
      if (!deleted) {
        throw new NotFoundException(`Semester with ID ${id} not found`);
      }
    }, context);
  }
}
