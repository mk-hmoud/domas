import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { DormCertificatesRepository } from '../repositories/dorm-certificates.repository';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { BookingsRepository } from '../../bookings/repositories/bookings.repository';
import { BedsRepository } from '../../locations/repositories/beds.repository';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { StorageService } from '../../../common/storage/storage.service';
import { DatabaseService } from '../../../core/database/database.service';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { DormCertificateRequest } from '../entities/dorm-certificate-request.entity';
import { EnrollmentVerification } from '../../students/entities/enrollment-verification.entity';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';

@Injectable()
export class DormCertificatesService {
  private readonly logger = new Logger(DormCertificatesService.name);
  private readonly fontPath = path.join(process.cwd(), 'src/assets/fonts/Roboto-Regular.ttf');
  private readonly fontBoldPath = path.join(process.cwd(), 'src/assets/fonts/Roboto-Bold.ttf');

  private static readonly ALLOWED_CERT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  constructor(
    private readonly dormCertsRepository: DormCertificatesRepository,
    private readonly studentsRepository: StudentsRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly bedsRepository: BedsRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly storage: StorageService,
    private readonly db: DatabaseService,
    private readonly undoService: UndoService,
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

  async approve(id: string, reviewerId: string): Promise<DormCertificateRequest> {
    const request = await this.dormCertsRepository.findById(id);
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'pending') {
      throw new BadRequestException('Request has already been reviewed');
    }

    const student = await this.studentsRepository.findById(request.studentId);
    if (!student) throw new NotFoundException('Student not found');

    const bookings = await this.bookingsRepository.findAll({ studentId: student.id });
    const activeBooking = bookings.find((b) =>
      [
        BookingOpsStatus.ACTIVE,
        BookingOpsStatus.READY_FOR_CHECKIN,
        BookingOpsStatus.CONFIRMED,
      ].includes(b.status as BookingOpsStatus),
    );

    let bed: any = null;
    let room: any = null;
    if (activeBooking) {
      bed = await this.bedsRepository.findById(activeBooking.bedId);
      if (bed) room = await this.locationsRepository.findById(bed.locationId);
    }

    const managerRes = await this.db.query(`
      SELECT u.* FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Dorm Manager' AND u.is_active = TRUE
      LIMIT 1
    `);
    const manager = managerRes.rows[0];

    const pdfBuffer = await this.generateDormCertPdf(student, activeBooking, room, bed, manager);

    const filename = `dorm-certificate-${student.studentNumber}-${Date.now()}.pdf`;
    const storageKey = `dorm-certificates/${id}/${randomUUID()}.pdf`;
    await this.storage.upload(storageKey, pdfBuffer, 'application/pdf');

    this.logger.log(`Dorm certificate generated for student ${student.studentNumber}`);
    const result = await this.dormCertsRepository.approve(id, reviewerId, storageKey, filename);

    await this.undoService.registerUndo({
      userId: reviewerId,
      actionType: UndoActionType.APPROVE_DORM_CERT,
      entityType: 'dorm_certificate_request',
      entityId: id,
      undoData: { storageKey },
      description: `Approved dorm certificate request ${id}`,
    });

    return result;
  }

  private generateDormCertPdf(
    student: any,
    booking: any,
    room: any,
    bed: any,
    manager: any,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const isTR = student.nationalityCode === 'TR';
      const doc = new PDFDocument({ margin: 60, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.registerFont('Custom-Regular', this.fontPath);
      doc.registerFont('Custom-Bold', this.fontBoldPath);
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const managerName =
        manager?.firstName && manager?.lastName
          ? `${manager.firstName} ${manager.lastName}`
          : 'Umut KAYIKCI';

      // Header
      doc
        .font('Custom-Bold')
        .fontSize(13)
        .text('EUROPEAN UNIVERSITY OF LEFKE', { align: 'center' });
      doc
        .fontSize(10)
        .text(isTR ? 'Konaklama ve Yurt Yönetimi' : 'Accommodation and Housing Management', {
          align: 'center',
        });
      doc.moveDown(0.5);
      doc
        .fontSize(14)
        .text(isTR ? 'YURT KONAKLAMA BELGESİ' : 'DORMITORY ACCOMMODATION CERTIFICATE', {
          align: 'center',
          underline: true,
        });
      doc.moveDown(1.5);

      // Body
      doc.font('Custom-Regular').fontSize(11);

      const issueDate = new Date().toLocaleDateString(isTR ? 'tr-TR' : 'en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const roomLine =
        room && bed
          ? isTR
            ? `${room.name} numaralı odada, ${bed.label} numaralı yatakta`
            : `Room ${room.name}, Bed ${bed.label},`
          : isTR
            ? 'Üniversite yurdunda'
            : 'in the university dormitory';

      const body = isTR
        ? `Bu belge, ${student.firstName} ${student.lastName} isimli, ${student.studentNumber} kayıt numaralı öğrencinin, Lefke Merkez Yurdu'nda ${roomLine} ikamet ettiğini tasdik etmek amacıyla düzenlenmiştir.`
        : `This is to certify that ${student.firstName} ${student.lastName}, student number ${student.studentNumber}, is currently residing at the EUL Lefke Center Dormitory, ${roomLine} as of ${issueDate}.`;

      doc.text(body, { align: 'justify', lineGap: 4 });
      doc.moveDown(1);

      if (booking) {
        const startDate = new Date(booking.startDate).toLocaleDateString(isTR ? 'tr-TR' : 'en-GB');
        const endDate = new Date(booking.endDate).toLocaleDateString(isTR ? 'tr-TR' : 'en-GB');
        const periodLine = isTR
          ? `Konaklama Dönemi: ${startDate} – ${endDate}`
          : `Accommodation Period: ${startDate} – ${endDate}`;
        doc.text(periodLine);
        doc.moveDown(0.5);
      }

      doc.text(isTR ? `Düzenleme Tarihi: ${issueDate}` : `Date of Issue: ${issueDate}`);
      doc.moveDown(3);

      // Signature
      const ySig = doc.y;
      doc.font('Custom-Bold').fontSize(10);
      doc.text(isTR ? 'Yurtlar Müdürü' : 'Dormitory Manager', 60, ySig);
      doc.font('Custom-Regular').text(managerName, 60, ySig + 15);
      doc.text(
        isTR
          ? 'İmza: ..................................'
          : 'Signature: ..................................',
        60,
        ySig + 40,
      );

      doc.end();
    });
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
    const result = await this.dormCertsRepository.reject(id, reviewerId, rejectionReason);

    await this.undoService.registerUndo({
      userId: reviewerId,
      actionType: UndoActionType.REJECT_DORM_CERT,
      entityType: 'dorm_certificate_request',
      entityId: id,
      undoData: { rejectionReason },
      description: `Rejected dorm certificate request ${id}`,
    });

    return result;
  }
}
