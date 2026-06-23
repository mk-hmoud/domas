import {
  Injectable,
  Logger,
  NotFoundException,
  HttpStatus,
  Inject,
  forwardRef,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ApiException } from '../../../common/exceptions/api.exception';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StudentsRepository } from '../repositories/students.repository';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { FindAllStudentsDto } from '../dto/find-all-students.dto';
import { ResolveContactsDto } from '../dto/resolve-contacts.dto';
import { Student } from '../entities/student.entity';
import { ResolvedContact } from '../repositories/students.repository';
import { DatabaseService } from '../../../core/database/database.service';
import { StorageService } from '../../../common/storage/storage.service';
import { EnrollmentVerification } from '../entities/enrollment-verification.entity';
import {
  StudentApplication,
  ApplicationStatus,
} from '../../student-portal/entities/student-application.entity';
import { StudentApplicationsRepository } from '../../student-portal/repositories/student-applications.repository';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { BadRequestException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  private static readonly ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  constructor(
    private readonly studentsRepository: StudentsRepository,
    @Inject(forwardRef(() => UndoService))
    private readonly undoService: UndoService,
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
    private readonly applicationsRepository: StudentApplicationsRepository,
    private readonly locationScopeService: LocationScopeService,
  ) {}

  // Students with no current placement have no location to check, so they're
  // visible to any scoped staff - only placed students are restricted to the
  // location their active booking falls under.
  private async assertStudentInScope(
    studentId: string,
    context: AuditUserContext,
    client?: PoolClient,
  ): Promise<void> {
    if (context.locationScope?.unrestricted) return;
    const treePath = await this.studentsRepository.getCurrentLocationTreePath(studentId, client);
    if (treePath === null) return;
    this.locationScopeService.assertAccess(context.locationScope, treePath);
  }

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

  async findAll(
    dto: FindAllStudentsDto,
    context: AuditUserContext,
  ): Promise<PaginatedResult<Student>> {
    return this.studentsRepository.findAll(dto, undefined, context.locationScope);
  }

  async findById(id: string, context: AuditUserContext): Promise<Student> {
    const student = await this.studentsRepository.findById(id);
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    await this.assertStudentInScope(id, context);
    if (student.photoStorageKey) {
      student.photoUrl = await this.storage.presign(student.photoStorageKey);
      student.photoStorageKey = undefined;
    }
    return student;
  }

  async getHistory(id: string, context: AuditUserContext): Promise<any[]> {
    const student = await this.studentsRepository.findById(id);
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    await this.assertStudentInScope(id, context);
    return this.studentsRepository.findBookingHistory(id);
  }

  async uploadPhoto(id: string, file: Express.Multer.File): Promise<{ photoUrl: string }> {
    if (!StudentsService.ALLOWED_PHOTO_TYPES.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException('Only JPEG, PNG, and WebP images are accepted');
    }
    const student = await this.studentsRepository.findById(id);
    if (!student) throw new NotFoundException(`Student with ID ${id} not found`);

    if (student.photoStorageKey) {
      await this.storage.delete(student.photoStorageKey);
    }

    const key = `students/${id}/photo`;
    await this.storage.upload(key, file.buffer, file.mimetype);
    await this.studentsRepository.setPhotoKey(id, key);

    const photoUrl = await this.storage.presign(key);
    return { photoUrl };
  }

  async deletePhoto(id: string): Promise<void> {
    const student = await this.studentsRepository.findById(id);
    if (!student) throw new NotFoundException(`Student with ID ${id} not found`);
    if (student.photoStorageKey) {
      await this.storage.delete(student.photoStorageKey);
    }
    await this.studentsRepository.clearPhotoKey(id);
  }

  async update(id: string, data: UpdateStudentDto, context: AuditUserContext): Promise<Student> {
    this.logger.log({ studentId: id }, 'Updating student profile');
    return this.db.transaction(async (client) => {
      const existing = await this.studentsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }
      await this.assertStudentInScope(id, context, client);

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
      await this.assertStudentInScope(id, context, client);

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
      for (const id of ids) {
        await this.assertStudentInScope(id, context, client);
      }
      await this.studentsRepository.updateStatusMany(ids, isActive, client);
    }, context);
  }

  async resolveContacts(dto: ResolveContactsDto): Promise<ResolvedContact[]> {
    return this.studentsRepository.resolveContacts(dto);
  }

  async updateStatus(id: string, isActive: boolean, context: AuditUserContext): Promise<Student> {
    this.logger.log({ studentId: id, isActive }, 'Updating student status');
    return this.db.transaction(async (client) => {
      const existing = await this.studentsRepository.findById(id, client);
      if (!existing) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }
      await this.assertStudentInScope(id, context, client);
      const updated = await this.studentsRepository.update(id, { isActive }, client);
      return updated!;
    }, context);
  }

  // ─── Enrollment Verifications ─────────────────────────────────────────────────

  async getEnrollmentCerts(
    studentId: string,
  ): Promise<(EnrollmentVerification & { url?: string })[]> {
    const certs = await this.studentsRepository.findEnrollmentCerts(studentId);
    return Promise.all(
      certs.map(async (cert) => {
        const url = await this.storage.presign(cert.storageKey);
        return { ...cert, url };
      }),
    );
  }

  async reviewEnrollmentCert(
    studentId: string,
    certId: string,
    action: 'verify' | 'reject',
    reviewerId: string,
    rejectionReason?: string,
  ): Promise<EnrollmentVerification> {
    const cert = await this.studentsRepository.findEnrollmentCertById(certId);
    if (!cert || cert.studentId !== studentId) {
      throw new NotFoundException('Certificate not found');
    }
    if (action === 'reject' && !rejectionReason) {
      throw new Error('Rejection reason is required');
    }
    return this.studentsRepository.updateEnrollmentCert(certId, {
      status: action === 'verify' ? 'verified' : 'rejected',
      rejectionReason,
      reviewedBy: reviewerId,
    });
  }

  async getEnrollmentCertUrl(studentId: string, certId: string): Promise<{ url: string }> {
    const cert = await this.studentsRepository.findEnrollmentCertById(certId);
    if (!cert || cert.studentId !== studentId) {
      throw new NotFoundException('Certificate not found');
    }
    const url = await this.storage.presign(cert.storageKey);
    return { url };
  }

  // ─── Student Applications ─────────────────────────────────────────────────────

  async listApplications(filter?: {
    status?: ApplicationStatus;
  }): Promise<(StudentApplication & { documentUrl: string })[]> {
    const applications = await this.applicationsRepository.findAll(filter);
    return Promise.all(
      applications.map(async (app) => {
        const documentUrl = await this.storage.presign(app.documentStorageKey);
        return { ...app, documentUrl };
      }),
    );
  }

  async reviewApplication(
    id: string,
    action: 'approve' | 'reject',
    reviewerId: string,
    rejectionReason?: string,
  ): Promise<StudentApplication> {
    const application = await this.applicationsRepository.findById(id);
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== 'pending') {
      throw new BadRequestException('Application has already been reviewed');
    }

    if (action === 'reject') {
      if (!rejectionReason) throw new BadRequestException('Rejection reason is required');
      return this.applicationsRepository.reject(id, reviewerId, rejectionReason);
    }

    return this.db.transaction(async (client) => {
      // Student record is always created at submission time; find it by student number.
      // Fall back to creating one here only for applications that pre-date this behaviour
      // (e.g. manually entered or legacy data).
      let student = await this.studentsRepository.findByStudentNumber(
        application.studentNumber,
        client,
      );

      if (!student) {
        student = await this.studentsRepository.create(
          {
            studentNumber: application.studentNumber,
            firstName: application.firstName,
            lastName: application.lastName,
            gender: application.gender as any,
            nationalityCode: application.nationalityCode,
            nationalId: application.nationalId,
            birthDate: application.birthDate.toISOString().split('T')[0],
            birthPlace: application.birthPlace,
            department: application.department,
            email: application.email,
            phoneNumber: application.phoneNumber,
            whatsappNumber: application.whatsappNumber,
          },
          reviewerId,
          client,
        );
      }

      // Activate the account
      await this.studentsRepository.setEnrollmentStatus(student.id, 'enrolled', client);

      // Store the submitted certificate for returning students
      if (application.documentType === 'returning') {
        await this.studentsRepository.insertEnrollmentCert(
          student.id,
          {
            filename: application.documentFilename,
            mimeType: application.documentMimeType,
            size: application.documentSize,
            storageKey: application.documentStorageKey,
            expiryDate: application.documentExpiryDate,
          },
          client,
        );
      }

      return this.applicationsRepository.approve(id, reviewerId, student.id, client);
    });
  }

  async getApplicationDocumentUrl(id: string): Promise<{ url: string }> {
    const application = await this.applicationsRepository.findById(id);
    if (!application) throw new NotFoundException('Application not found');
    const url = await this.storage.presign(application.documentStorageKey);
    return { url };
  }

  async getApplicationLetterUrl(id: string): Promise<{ url: string }> {
    return this.getApplicationDocumentUrl(id);
  }
}
