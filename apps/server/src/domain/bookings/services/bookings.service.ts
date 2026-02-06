import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { BookingsRepository } from '../repositories/bookings.repository';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { ApproveFinancialsDto } from '../dto/approve-financials.dto';
import { Booking } from '../entities/booking.entity';
import { DatabaseService } from '../../../core/database/database.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { BedsRepository } from '../../locations/repositories/beds.repository';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { UsersService } from '../../users/services/users.service';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';
import { InventoryService } from '../../inventory/services/inventory.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly bedsRepository: BedsRepository,
    private readonly studentsRepository: StudentsRepository,
    private readonly usersService: UsersService,
    private readonly undoService: UndoService,
    private readonly inventoryService: InventoryService,
    private readonly db: DatabaseService,
  ) {}

  async create(data: CreateBookingDto, context: AuditUserContext): Promise<Booking> {
    this.logger.log({ studentId: data.studentId, bedId: data.bedId }, 'Creating new booking');

    // 1. Fetch Constraints Data
    const student = await this.studentsRepository.findById(data.studentId);
    if (!student) throw new NotFoundException(`Student with ID ${data.studentId} not found`);

    const bed = await this.bedsRepository.findById(data.bedId);
    if (!bed) throw new NotFoundException(`Bed with ID ${data.bedId} not found`);

    const room = await this.locationsRepository.findById(bed.locationId);
    if (!room) throw new NotFoundException(`Location for bed ${data.bedId} not found`);

    // 2. Fetch hierarchy for inheritance checks (isTrOnly and Ownership)
    const hierarchy = await this.locationsRepository.findWithAncestors(room.id);

    // 3. Check TR Only Constraint (Inherited)
    const isTrOnly = hierarchy.some((loc) => loc.isTrOnly);
    if (isTrOnly && student.nationalityCode !== 'TR') {
      throw new BadRequestException('This location is reserved for Turkish citizens only');
    }

    // 4. Check Ownership Constraint (Rectorate - Inherited)
    const isRectorate = hierarchy.some((loc) => loc.ownership === LocationOwnership.RECTORATE);

    if (isRectorate) {
      // Check if user is Admin
      const user = await this.usersService.findById(context.userId);
      if (!user || !user.isRecoveryAdmin) {
        throw new ForbiddenException('Only Recovery Admin can book Rectorate-owned locations');
      }
    }

    return this.db.transaction(async (client) => {
      const booking = await this.bookingsRepository.create(data, client);
      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.CREATE_BOOKING,
          entityType: 'booking',
          entityId: booking.id,
          undoData: {},
          description: `Created booking for student ${student.studentNumber}`,
        },
        client,
      );
      this.logger.log({ bookingId: booking.id }, 'Booking created successfully');
      return booking;
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
        await this.undoService.registerUndo(
          {
            userId: context.userId,
            actionType: UndoActionType.REJECT_BOOKING,
            entityType: 'booking',
            entityId: id,
            undoData: { previousStatus: booking.status },
            description: `Rejected booking ${id} (Financials)`,
          },
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

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.APPROVE_BOOKING_FINANCIALS,
          entityType: 'booking',
          entityId: id,
          undoData: {
            previousStatus: booking.status,
            previousPaymentStatus: booking.paymentStatus,
            previousIsAccountingApproved: booking.isAccountingApproved,
          },
          description: `Approved financials for booking ${id}`,
        },
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

      // Generate inventory snapshot for the contract
      await this.inventoryService.generateSnapshotForBooking(id, booking.bedId, context, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.CHECK_IN_BOOKING,
          entityType: 'booking',
          entityId: id,
          undoData: {
            previousStatus: booking.status,
            previousCheckInDate: booking.checkedInAt,
          },
          description: `Checked in booking ${id}`,
        },
        client,
      );

      this.logger.log({ bookingId: id }, 'Check-in completed');
      return updated!;
    }, context);
  }

  async update(id: string, data: UpdateBookingDto, context: AuditUserContext): Promise<Booking> {
    return this.db.transaction(async (client) => {
      const booking = await this.bookingsRepository.findById(id, client);
      if (!booking) throw new NotFoundException(`Booking with ID ${id} not found`);

      const updated = await this.bookingsRepository.update(id, data, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_BOOKING,
          entityType: 'booking',
          entityId: id,
          undoData: booking,
          description: `Updated booking ${id}`,
        },
        client,
      );

      return updated!;
    }, context);
  }
}
