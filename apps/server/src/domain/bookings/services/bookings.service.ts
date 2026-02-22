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
import { AccessCardsService } from '../../access-cards/services/access-cards.service';
import { ContractsService } from '../../contracts/services/contracts.service';
import { CheckInBookingDto } from '../dto/check-in-booking.dto';
import { CheckOutBookingDto } from '../dto/check-out-booking.dto';
import { Inject, forwardRef } from '@nestjs/common';
import { BedStatus } from 'src/common/enums/bed-status.enum';

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
    private readonly accessCardsService: AccessCardsService,
    @Inject(forwardRef(() => ContractsService))
    private readonly contractsService: ContractsService,
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

  async checkIn(
    id: string,
    data: CheckInBookingDto,
    context: AuditUserContext,
  ): Promise<Booking & { assignedCardNumber?: number }> {
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

      // 1. Generate inventory snapshot for the contract
      await this.inventoryService.generateSnapshotForBooking(
        id,
        booking.bedId,
        data.selectedExtraCatalogIds || [],
        context,
        client,
      );

      // 2. Handle Card Assignment
      let assignedCardNumber: number | undefined;
      if (data.autoAssignCard || data.specificCardNumber) {
        const card = await this.accessCardsService.issueCard(
          {
            studentId: booking.studentId,
            bookingId: booking.id,
            cardNumber: data.specificCardNumber,
          },
          context,
          client,
          true, // skipUndo
        );
        assignedCardNumber = card.cardNumber;
      }

      // 3. Generate Contract PDF
      try {
        await this.contractsService.generateCheckInContract(id, context.userId, client);
      } catch (contractError: any) {
        this.logger.error(
          { bookingId: id, error: contractError.message },
          'Failed to generate contract',
        );
      }

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

      this.logger.log({ bookingId: id, assignedCardNumber }, 'Check-in completed');
      return {
        ...updated!,
        assignedCardNumber,
      };
    }, context);
  }

  async checkOut(
    id: string,
    data: CheckOutBookingDto,
    context: AuditUserContext,
  ): Promise<Booking> {
    this.logger.log({ bookingId: id }, 'Processing check-out');

    return this.db.transaction(async (client) => {
      const booking = await this.bookingsRepository.findById(id, client);
      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      if (booking.status !== BookingOpsStatus.ACTIVE) {
        throw new BadRequestException(`Booking is in ${booking.status} state, cannot check out`);
      }

      // 1. Update Booking Status
      const updated = await this.bookingsRepository.checkOut(id, client);

      // 2. Return Access Card (if any)
      // Find the active card for this booking
      const cardRes = await client.query(
        "SELECT id FROM access_cards WHERE current_booking_id = $1 AND status = 'active' LIMIT 1",
        [id],
      );
      let cardId: number | undefined;
      if (cardRes.rowCount && cardRes.rowCount > 0) {
        cardId = cardRes.rows[0].id;
        await this.accessCardsService.returnCard(
          cardId!,
          { notes: data.notes },
          context,
          client,
          true, // skipUndo
        );
      }

      // 3. Make Bed Available
      await this.bedsRepository.updateStatus(booking.bedId, BedStatus.AVAILABLE, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.CHECK_OUT_BOOKING,
          entityType: 'booking',
          entityId: id,
          undoData: {
            previousStatus: booking.status,
            previousCheckedOutAt: booking.checkedOutAt,
            bedId: booking.bedId,
            cardId: cardId,
          },
          description: `Checked out booking ${id}`,
        },
        client,
      );

      this.logger.log({ bookingId: id }, 'Check-out completed');
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
