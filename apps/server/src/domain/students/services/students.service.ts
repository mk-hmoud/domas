import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { StudentsRepository } from '../repositories/students.repository';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { FindAllStudentsDto } from '../dto/find-all-students.dto';
import { Student } from '../entities/student.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly studentsRepository: StudentsRepository,
    private readonly db: DatabaseService,
  ) {}

  private validateNationalId(nationalityCode: string, nationalId: string): void {
    if (nationalityCode === 'TR') {
      // Turkish TC ID: 11 digits, first digit cannot be 0
      const tcRegex = /^[1-9][0-9]{10}$/;
      if (!tcRegex.test(nationalId)) {
        throw new BadRequestException('Invalid Turkish ID Number (must be 11 digits)');
      }
    } else {
      // Generic Passport check: min 5 chars, allowing alphanumeric and common separators
      if (nationalId.length < 5) {
        throw new BadRequestException('Passport number too short (minimum 5 characters)');
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
      return updated!;
    }, context);
  }
}
