import { Injectable, Logger, NotFoundException, HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/exceptions/api.exception';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StudentsRepository } from '../repositories/students.repository';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { FindAllStudentsDto } from '../dto/find-all-students.dto';
import { Student } from '../entities/student.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { PoolClient } from 'pg';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly studentsRepository: StudentsRepository,
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
  ) {}

  private validateNationalId(nationalityCode: string, nationalId: string): void {
    if (nationalityCode === 'TR') {
      // Turkish TC ID: 11 digits, first digit cannot be 0
      const tcRegex = /^[1-9][0-9]{10}$/;
      if (!tcRegex.test(nationalId)) {
        throw new ApiException(
          'Invalid Turkish ID Number (must be 11 digits)',
          ErrorCodes.INVALID_NATIONAL_ID,
          HttpStatus.BAD_REQUEST,
          'Please enter a valid 11-digit Turkish ID number.',
        );
      }
    } else {
      // Generic Passport check: min 5 chars, allowing alphanumeric and common separators
      if (nationalId.length < 5) {
        throw new ApiException(
          'Passport number too short',
          ErrorCodes.INVALID_PASSPORT_ID,
          HttpStatus.BAD_REQUEST,
          'Passport number must be at least 5 characters long.',
        );
      }
    }
  }

  async create(data: CreateStudentDto, context: AuditUserContext): Promise<Student> {
    this.logger.log({ studentNumber: data.studentNumber }, 'Creating new student profile');

    this.validateNationalId(data.nationalityCode, data.nationalId);

    return this.db.transaction(async (client) => {
      const student = await this.studentsRepository.create(data, context.userId, client);
      this.logger.log({ studentId: student.id }, 'Student profile created');
      return student;
    }, context);
  }

  async findAll(dto: FindAllStudentsDto): Promise<PaginatedResult<Student>> {
    return this.studentsRepository.findAll(dto);
  }

  async findById(id: string): Promise<Student> {
    const student = await this.studentsRepository.findById(id);
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async update(id: string, data: UpdateStudentDto, context: AuditUserContext): Promise<Student> {
    this.logger.log({ studentId: id }, 'Updating student profile');
    return this.db.transaction(async (client) => {
      const existing = await this.studentsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      // If either nationality or ID is changing, re-validate
      if (data.nationalityCode || data.nationalId) {
        this.validateNationalId(
          data.nationalityCode || existing.nationalityCode,
          data.nationalId || existing.nationalId,
        );
      }

      const updated = await this.studentsRepository.update(id, data, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_STUDENT,
          entityType: 'student',
          entityId: id,
          undoData: existing,
          description: `Updated student ${existing.firstName} ${existing.lastName}`,
        },
        client,
      );

      return updated!;
    }, context);
  }

  async delete(id: string, context: AuditUserContext, externalClient?: PoolClient): Promise<void> {
    const operation = async (client: PoolClient) => {
      const existing = await this.studentsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      await this.studentsRepository.delete(id, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.DELETE_STUDENT,
          entityType: 'student',
          entityId: id,
          undoData: existing,
          description: `Deleted student ${existing.firstName} ${existing.lastName}`,
        },
        client,
      );
    };

    if (externalClient) return operation(externalClient);

    this.logger.log({ studentId: id }, 'Deleting student profile');
    await this.db.transaction(operation, context);
    this.logger.log({ studentId: id }, 'Student profile deleted');
  }

  async deleteMany(ids: string[], context: AuditUserContext): Promise<void> {
    this.logger.log({ count: ids.length }, 'Bulk deleting students');
    await this.db.transaction(async (client) => {
      for (const id of ids) {
        await this.delete(id, context, client);
      }
    }, context);
  }

  async updateStatusMany(
    ids: string[],
    isActive: boolean,
    context: AuditUserContext,
  ): Promise<void> {
    this.logger.log({ count: ids.length, isActive }, 'Bulk updating student status');
    await this.db.transaction(async (client) => {
      await this.studentsRepository.updateStatusMany(ids, isActive, client);
    }, context);
  }

  async updateStatus(id: string, isActive: boolean, context: AuditUserContext): Promise<Student> {
    this.logger.log({ studentId: id, isActive }, 'Updating student status');
    return this.db.transaction(async (client) => {
      const existing = await this.studentsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }
      const updated = await this.studentsRepository.update(id, { isActive }, client);
      return updated!;
    }, context);
  }
}
