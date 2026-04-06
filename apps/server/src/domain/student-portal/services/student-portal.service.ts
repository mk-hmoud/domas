import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { Student } from '../../students/entities/student.entity';
import { UpdateStudentContactDto } from '../dto/update-student-contact.dto';

@Injectable()
export class StudentPortalService {
  constructor(private readonly studentsRepository: StudentsRepository) {}

  async loginByStudentNumber(studentNumber: string): Promise<Student> {
    const student = await this.studentsRepository.findByStudentNumber(studentNumber);
    if (!student || !student.isActive) {
      throw new UnauthorizedException('Student not found or inactive');
    }
    return student;
  }

  async getProfile(studentId: string): Promise<Student> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async updateContact(studentId: string, dto: UpdateStudentContactDto): Promise<Student> {
    const updated = await this.studentsRepository.update(studentId, {
      email: dto.email,
      phoneNumber: dto.phoneNumber,
    });
    if (!updated) {
      throw new NotFoundException('Student not found');
    }
    return updated;
  }
}
