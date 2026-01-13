import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { BookingsRepository } from '../repositories/bookings.repository';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { ApproveFinancialsDto } from '../dto/approve-financials.dto';
import { Booking } from '../entities/booking.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly db: DatabaseService,
  ) {}

  async create(data: CreateBookingDto, context: AuditUserContext): Promise<Booking> {
    this.logger.log({ studentId: data.studentId, bedId: data.bedId }, 'Creating new booking');

    return this.db.transaction(async (client) => {
      // Ensure student exists? (Rely on FK for now)

      try {
        const booking = await this.bookingsRepository.create(data, client);
        this.logger.log({ bookingId: booking.id }, 'Booking created successfully');
        return booking;
      } catch (error: any) {
        // Postgres Error 23P01 = exclusion_violation
        if (error.code === '23P01') {
          throw new ConflictException(
            'Double Booking Detected: This bed is already occupied for the selected dates.',
          );
        }
        throw error;
      }
    }, context);
  }

  async findById(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async findAll(filters: { studentId?: string; status?: BookingOpsStatus }): Promise<Booking[]> {
    return this.bookingsRepository.findAll(filters);
  }

  async approveFinancials(
    id: string,
    data: ApproveFinancialsDto,
    context: AuditUserContext,
  ): Promise<Booking> {
    this.logger.log({ bookingId: id, approved: data.approved }, 'Processing financial approval');

    return this.db.transaction(async (client) => {
      const booking = await this.bookingsRepository.findById(id, client);
      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      if (booking.status !== BookingOpsStatus.PENDING_ACCOUNTING) {
        throw new BadRequestException(
          `Booking is in ${booking.status} state, cannot approve financials`,
        );
      }

      if (!data.approved) {
        // Rejected by accounting
        const updated = await this.bookingsRepository.update(
          id,
          { status: BookingOpsStatus.REJECTED },
          client,
        );
        this.logger.warn({ bookingId: id }, 'Booking rejected by accounting');
        return updated!;
      }

      const updated = await this.bookingsRepository.approveFinancials(
        id,
        context.userId,
        data.paymentStatus,
        client,
      );

      this.logger.log({ bookingId: id }, 'Financials approved successfully');
      return updated!;
    }, context);
  }

  async checkIn(id: string, context: AuditUserContext): Promise<Booking> {
    this.logger.log({ bookingId: id }, 'Processing check-in');

    return this.db.transaction(async (client) => {
      const booking = await this.bookingsRepository.findById(id, client);
      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      if (!booking.isAccountingApproved) {
        throw new ForbiddenException('Cannot check in: Financial approval required');
      }

      if (booking.status !== BookingOpsStatus.READY_FOR_CHECKIN) {
        throw new BadRequestException(`Invalid status for check-in: ${booking.status}`);
      }

      const updated = await this.bookingsRepository.checkIn(id, client);

      // LOGIC: Trigger other side effects?
      // e.g. Update User.isActive = true if first booking?

      this.logger.log({ bookingId: id }, 'Check-in completed');
      return updated!;
    }, context);
  }

  async update(id: string, data: UpdateBookingDto, context: AuditUserContext): Promise<Booking> {
    return this.db.transaction(async (client) => {
      const booking = await this.bookingsRepository.findById(id, client);
      if (!booking) throw new NotFoundException(`Booking with ID ${id} not found`);

      const updated = await this.bookingsRepository.update(id, data, client);
      return updated!;
    }, context);
  }
}
