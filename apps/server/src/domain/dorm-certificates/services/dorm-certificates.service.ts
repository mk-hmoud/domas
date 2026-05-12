import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DormCertificatesRepository } from '../repositories/dorm-certificates.repository';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { StorageService } from '../../../common/storage/storage.service';
import { DormCertificateRequest } from '../entities/dorm-certificate-request.entity';
import { EnrollmentVerification } from '../../students/entities/enrollment-verification.entity';

@Injectable()
export class DormCertificatesService {
  private static readonly ALLOWED_CERT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  constructor(
    private readonly dormCertsRepository: DormCertificatesRepository,
    private readonly studentsRepository: StudentsRepository,
    private readonly storage: StorageService,
  ) {}

  async getEligibility(studentId: string): Promise<{
    eligible: boolean;
    reason?: string;
    validCert: EnrollmentVerification | null;
  }> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');

    if (student.enrollmentStatus !== 'enrolled') {
      return { eligible: false, reason: 'account_pending', validCert: null };
    }

    const validCert = await this.studentsRepository.findValidEnrollmentCert(studentId);
    if (!validCert) {
      return { eligible: false, reason: 'no_valid_certificate', validCert: null };
    }

    return { eligible: true, validCert };
  }

  async requestCertificate(
    studentId: string,
    certFile?: Express.Multer.File,
    certExpiryDate?: Date,
  ): Promise<DormCertificateRequest> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');

    if (student.enrollmentStatus !== 'enrolled') {
      throw new ForbiddenException('Your account is pending approval');
    }

    if (await this.dormCertsRepository.hasPendingForStudent(studentId)) {
      throw new ConflictException('You already have a pending dorm certificate request');
    }

    let validCert = await this.studentsRepository.findValidEnrollmentCert(studentId);

    if (!validCert) {
      if (!certFile) {
        throw new BadRequestException(
          'No valid certificate on file. Please upload your student certificate.',
        );
      }
      if (!DormCertificatesService.ALLOWED_CERT_TYPES.includes(certFile.mimetype)) {
        throw new UnsupportedMediaTypeException('Only PDF, JPEG, PNG, and WebP files are accepted');
      }
      const storageKey = `students/${studentId}/enrollment/${randomUUID()}`;
      await this.storage.upload(storageKey, certFile.buffer, certFile.mimetype);
      validCert = await this.studentsRepository.insertEnrollmentCert(studentId, {
        filename: certFile.originalname,
        mimeType: certFile.mimetype,
        size: certFile.size,
        storageKey,
        expiryDate: certExpiryDate,
      });
    }

    return this.dormCertsRepository.insert(studentId, validCert.id);
  }

  async getMyRequests(studentId: string): Promise<DormCertificateRequest[]> {
    const requests = await this.dormCertsRepository.findByStudent(studentId);
    return Promise.all(
      requests.map(async (r) => {
        if (r.certificateStorageKey) {
          r.certificateUrl = await this.storage.presign(r.certificateStorageKey);
        }
        return r;
      }),
    );
  }

  // ─── Admin ────────────────────────────────────────────────────────────────────

  async listAll(status?: string): Promise<any[]> {
    const requests = await this.dormCertsRepository.findAll(
      status ? { status: status as any } : undefined,
    );
    return Promise.all(
      requests.map(async (r: any) => {
        if (r.enrollmentVerificationId) {
          const cert = await this.studentsRepository.findEnrollmentCertById(
            r.enrollmentVerificationId,
          );
          if (cert) r.enrollmentCertUrl = await this.storage.presign(cert.storageKey);
        }
        if (r.certificateStorageKey) {
          r.certificateUrl = await this.storage.presign(r.certificateStorageKey);
        }
        return r;
      }),
    );
  }

  async approve(
    id: string,
    reviewerId: string,
    file: Express.Multer.File,
  ): Promise<DormCertificateRequest> {
    if (file.mimetype !== 'application/pdf') {
      throw new UnsupportedMediaTypeException(
        'Only PDF files are accepted for issued certificates',
      );
    }
    const request = await this.dormCertsRepository.findById(id);
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'pending') {
      throw new BadRequestException('Request has already been reviewed');
    }

    const storageKey = `dorm-certificates/${id}/${randomUUID()}.pdf`;
    await this.storage.upload(storageKey, file.buffer, file.mimetype);

    return this.dormCertsRepository.approve(id, reviewerId, storageKey, file.originalname);
  }

  async reject(
    id: string,
    reviewerId: string,
    rejectionReason: string,
  ): Promise<DormCertificateRequest> {
    const request = await this.dormCertsRepository.findById(id);
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'pending') {
      throw new BadRequestException('Request has already been reviewed');
    }
    if (!rejectionReason) throw new BadRequestException('Rejection reason is required');
    return this.dormCertsRepository.reject(id, reviewerId, rejectionReason);
  }
}
