import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { PreReservationsRepository } from '../repositories/pre-reservations.repository';
import { CreatePreReservationDto } from '../dto/create-pre-reservation.dto';
import { AssignPreReservationDto } from '../dto/assign-pre-reservation.dto';
import { RejectPreReservationDto } from '../dto/reject-pre-reservation.dto';

@Injectable()
export class PreReservationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly undoService: UndoService,
    private readonly preReservationsRepo: PreReservationsRepository,
    private readonly studentsRepo: StudentsRepository,
  ) {}

  // ─── Student Portal ───────────────────────────────────────────────────────────

  async getMyPreReservations(studentId: string): Promise<any[]> {
    return this.preReservationsRepo.findByStudent(studentId);
  }

  async create(studentId: string, dto: CreatePreReservationDto): Promise<any> {
    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException('end_date must be after start_date');
    }

    const student = await this.studentsRepo.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');
    if (student.enrollmentStatus === 'pending') {
      throw new ForbiddenException('Your enrollment is pending approval');
    }

    return this.db.transaction(async (client) => {
      const semester = await this.preReservationsRepo.findSemester(dto.semesterId, client);
      if (!semester) throw new NotFoundException('Semester not found');
      if (!semester.allowPreReservations) {
        throw new BadRequestException('Pre-reservations are not open for this semester');
      }

      if (dto.startDate < semester.startDate || dto.endDate > semester.endDate) {
        throw new BadRequestException('Dates must fall within the semester period');
      }

      const alreadyPending = await this.preReservationsRepo.hasPendingForStudentSemester(
        studentId,
        dto.semesterId,
        client,
      );
      if (alreadyPending) {
        throw new ConflictException('You already have a pending pre-reservation for this semester');
      }

      return this.preReservationsRepo.create(
        {
          studentId,
          semesterId: dto.semesterId,
          startDate: dto.startDate,
          endDate: dto.endDate,
          roomTypeId: dto.roomTypeId ?? null,
          note: dto.note ?? null,
        },
        client,
      );
    });
  }

  async cancel(id: string, studentId: string): Promise<void> {
    const cancelled = await this.preReservationsRepo.cancel(id, studentId);
    if (!cancelled) throw new NotFoundException('Pending pre-reservation not found');
  }

  // ─── Staff ────────────────────────────────────────────────────────────────────

  async getAll(params?: { semesterId?: number; status?: string }): Promise<any[]> {
    return this.preReservationsRepo.findAll(params);
  }

  async assign(id: string, dto: AssignPreReservationDto, context: AuditUserContext): Promise<any> {
    return this.db.transaction(async (client) => {
      const preRes = await this.preReservationsRepo.findById(id, client);
      if (!preRes) throw new NotFoundException('Pre-reservation not found');
      if (preRes.status !== 'pending') {
        throw new BadRequestException('This pre-reservation has already been resolved');
      }

      const taken = await this.preReservationsRepo.isBedTakenForDateRange(
        dto.bedId,
        preRes.semesterId,
        preRes.startDate,
        preRes.endDate,
        client,
      );
      if (taken)
        throw new ConflictException('This bed is already occupied for the requested dates');

      // Create the booking
      const bookingResult = await client.query(
        `INSERT INTO bookings (student_id, bed_id, semester_id, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, $5, 'draft')
         RETURNING id`,
        [preRes.studentId, dto.bedId, preRes.semesterId, preRes.startDate, preRes.endDate],
      );
      const bookingId: string = bookingResult.rows[0].id;

      const updated = await this.preReservationsRepo.assign(
        id,
        { bookingId, resolvedBy: context.userId },
        client,
      );
      if (!updated) throw new NotFoundException('Pre-reservation not found or already resolved');

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.ASSIGN_PRE_RESERVATION,
          entityType: 'pre_reservation',
          entityId: id,
          undoData: { bookingId },
          description: `Assigned pre-reservation ${id} → booking ${bookingId}`,
        },
        client,
      );

      return updated;
    });
  }

  async reject(id: string, dto: RejectPreReservationDto, context: AuditUserContext): Promise<any> {
    return this.db.transaction(async (client) => {
      const preRes = await this.preReservationsRepo.findById(id, client);
      if (!preRes) throw new NotFoundException('Pre-reservation not found');
      if (preRes.status !== 'pending') {
        throw new BadRequestException('This pre-reservation has already been resolved');
      }

      const updated = await this.preReservationsRepo.reject(id, {
        resolvedBy: context.userId,
        rejectionReason: dto.rejectionReason ?? null,
      });
      if (!updated) throw new NotFoundException('Pre-reservation not found or already resolved');

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.REJECT_PRE_RESERVATION,
          entityType: 'pre_reservation',
          entityId: id,
          undoData: { rejectionReason: dto.rejectionReason ?? null },
          description: `Rejected pre-reservation ${id}`,
        },
        client,
      );

      return updated;
    });
  }

  async getAvailableBeds(semesterId: number, startDate: string, endDate: string): Promise<any[]> {
    return this.preReservationsRepo.findAvailableBeds({ semesterId, startDate, endDate });
  }
}
