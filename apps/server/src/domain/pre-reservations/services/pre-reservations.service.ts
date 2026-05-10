import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { PreReservationsRepository } from '../repositories/pre-reservations.repository';
import { CreatePreReservationDto } from '../dto/create-pre-reservation.dto';
import { AssignPreReservationDto } from '../dto/assign-pre-reservation.dto';
import { RejectPreReservationDto } from '../dto/reject-pre-reservation.dto';

@Injectable()
export class PreReservationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly preReservationsRepo: PreReservationsRepository,
  ) {}

  // ─── Student Portal ───────────────────────────────────────────────────────────

  async getMyPreReservations(studentId: string): Promise<any[]> {
    return this.preReservationsRepo.findByStudent(studentId);
  }

  async create(studentId: string, dto: CreatePreReservationDto): Promise<any> {
    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException('end_date must be after start_date');
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

  async assign(id: string, dto: AssignPreReservationDto, resolvedBy: string): Promise<any> {
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

      const updated = await this.preReservationsRepo.assign(id, { bookingId, resolvedBy }, client);
      if (!updated) throw new NotFoundException('Pre-reservation not found or already resolved');

      return updated;
    });
  }

  async reject(id: string, dto: RejectPreReservationDto, resolvedBy: string): Promise<any> {
    const preRes = await this.preReservationsRepo.findById(id);
    if (!preRes) throw new NotFoundException('Pre-reservation not found');
    if (preRes.status !== 'pending') {
      throw new BadRequestException('This pre-reservation has already been resolved');
    }

    const updated = await this.preReservationsRepo.reject(id, {
      resolvedBy,
      rejectionReason: dto.rejectionReason ?? null,
    });
    if (!updated) throw new NotFoundException('Pre-reservation not found or already resolved');
    return updated;
  }

  async getAvailableBeds(semesterId: number, startDate: string, endDate: string): Promise<any[]> {
    return this.preReservationsRepo.findAvailableBeds({ semesterId, startDate, endDate });
  }
}
