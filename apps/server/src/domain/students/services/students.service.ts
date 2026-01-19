import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  async create(data: CreateStudentDto, context: AuditUserContext): Promise<Student> {
    this.logger.log({ studentNumber: data.studentNumber }, 'Creating new student profile');
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

      const updated = await this.studentsRepository.update(id, data, client);
      return updated!;
    }, context);
  }
}
