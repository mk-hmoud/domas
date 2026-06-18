import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UndoService } from '../../audit/services/undo.service';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { BookingsRepository } from '../repositories/bookings.repository';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { UpdateBookingDatesDto } from '../dto/update-booking-dates.dto';
import { TransferBookingDto } from '../dto/transfer-booking.dto';
import { BulkTransferBookingDto } from '../dto/bulk-transfer-booking.dto';
import { ApproveFinancialsDto } from '../dto/approve-financials.dto';
import { FindAllBookingsDto } from '../dto/find-all-bookings.dto';
import { Booking } from '../entities/booking.entity';
import { DatabaseService } from '../../../core/database/database.service';
import { isTurkishNational } from '../../../common/utils/nationality.utils';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
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
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { PoolClient } from 'pg';
import {
  NotificationsService,
  NotificationType,
} from '../../notifications/services/notifications.service';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';

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
    private readonly notificationsService: NotificationsService,
    private readonly locationScopeService: LocationScopeService,
  ) {}

  // Fetches the booking and asserts the staff member's location scope
  // covers the bed it's tied to. Used before any single-booking read or
  // mutation.
  private async assertBookingInScope(
    bookingId: string,
    context: AuditUserContext,
    client?: PoolClient,
  ): Promise<Booking> {
    const booking = await this.bookingsRepository.findById(bookingId, client);
    if (!booking) throw new NotFoundException(`Booking with ID ${bookingId} not found`);

    if (!context.locationScope?.unrestricted) {
      const treePath = await this.bookingsRepository.findLocationTreePath(bookingId, client);
      this.locationScopeService.assertAccess(context.locationScope, treePath ?? '');
    }

    return booking;
  }

  async create(
    data: CreateBookingDto,
    context: AuditUserContext,
    externalClient?: PoolClient,
  ): Promise<Booking> {
    const operation = async (client: PoolClient) => {
      this.logger.log({ studentId: data.studentId, bedId: data.bedId }, 'Creating new booking');

      // 1. Fetch Constraints Data
      const student = await this.studentsRepository.findById(data.studentId, client);
      if (!student) throw new NotFoundException(`Student with ID ${data.studentId} not found`);

      const bed = await this.bedsRepository.findById(data.bedId, client);
      if (!bed) throw new NotFoundException(`Bed with ID ${data.bedId} not found`);

      const room = await this.locationsRepository.findById(bed.locationId, client);
      if (!room) throw new NotFoundException(`Location for bed ${data.bedId} not found`);
      this.locationScopeService.assertAccess(context.locationScope, room.treePath);

      // 2. Constraints Check
      const isTrOnly = room.isTrOnly || bed.isTrOnly;
      if (isTrOnly && student.nationalityCode !== 'TR') {
        throw new BadRequestException('This location is reserved for Turkish citizens only');
      }

      const isForeignerOnly = room.isForeignerOnly || bed.isForeignerOnly;
      if (isForeignerOnly && isTurkishNational(student.nationalityCode)) {
        throw new BadRequestException('This location is reserved for foreign students only');
      }

      const isRectorate =
        room.ownership === LocationOwnership.RECTORATE ||
        bed.ownership === LocationOwnership.RECTORATE;

      if (isRectorate) {
        const user = await this.usersService.findById(context.userId, context, client);
        if (!user || !user.isRecoveryAdmin) {
          throw new ForbiddenException('Only Recovery Admin can book Rectorate-owned locations');
        }
      }

      // 3. Fetch Semester & Dates
      const semesterRes = await client.query(
        'SELECT start_date, end_date FROM semesters WHERE id = $1',
        [data.semesterId],
      );
      if (semesterRes.rowCount === 0) throw new NotFoundException('Semester not found');
      const semester = semesterRes.rows[0];

      const finalStartDate = data.startDate || semester.start_date;
      const finalEndDate = data.endDate || semester.end_date;

      if (new Date(finalStartDate) >= new Date(finalEndDate)) {
        throw new BadRequestException('Start date must be before end date.');
      }

      // 4. Persist
      const booking = await this.bookingsRepository.create(
        {
          ...data,
          startDate: finalStartDate,
          endDate: finalEndDate,
        },
        client,
      );

      // 5. Dynamic Lock
      await this.locationsRepository.lockGenderIfNull(bed.locationId, student.gender, client);

      // 6. Audit
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
    };

    if (externalClient) return operation(externalClient);
    return this.db.transaction(operation, context);
  }

  async findById(id: string, context: AuditUserContext): Promise<Booking> {
    return this.assertBookingInScope(id, context);
  }

  async findAll(filters: FindAllBookingsDto, context: AuditUserContext): Promise<Booking[]> {
    return this.bookingsRepository.findAll(filters, undefined, context.locationScope);
  }

  async approveFinancials(
    id: string,
    data: ApproveFinancialsDto,
    context: AuditUserContext,
  ): Promise<Booking> {
    this.logger.log({ bookingId: id, approved: data.approved }, 'Processing financial approval');

    return this.db.transaction(async (client) => {
      const booking = await this.assertBookingInScope(id, context, client);

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
        const rejectUndoLog = await this.undoService.registerUndo(
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
        // Notify student (fire-and-forget after commit)
        setImmediate(() =>
          this.notificationsService.create(
            booking.studentId,
            NotificationType.BOOKING_REJECTED,
            'Application Not Approved',
            'Your accommodation application was not approved by the accounting office.',
            { bookingId: id },
            rejectUndoLog.id,
          ),
        );
        return updated!;
      }

      const targetStatus = booking.previousBookingId
        ? BookingOpsStatus.CONFIRMED
        : BookingOpsStatus.READY_FOR_CHECKIN;

      const updated = await this.bookingsRepository.approveFinancials(
        id,
        context.userId,
        data.paymentStatus,
        targetStatus,
        client,
      );

      const approveUndoLog = await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.APPROVE_BOOKING_FINANCIALS,
          entityType: 'booking',
          entityId: id,
          undoData: {
            previousStatus: booking.status,
            previousPaymentStatus: booking.paymentStatus,
          },
          description: `Approved financials for booking ${id}`,
        },
        client,
      );

      this.logger.log({ bookingId: id }, 'Financials approved successfully');
      // Notify student (fire-and-forget after commit)
      setImmediate(() =>
        this.notificationsService.create(
          booking.studentId,
          NotificationType.BOOKING_APPROVED,
          'Accommodation Approved',
          'Your accommodation application has been approved. Please proceed with check-in.',
          { bookingId: id },
          approveUndoLog.id,
        ),
      );
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
      const booking = await this.assertBookingInScope(id, context, client);

      if (booking.status !== BookingOpsStatus.READY_FOR_CHECKIN) {
        throw new BadRequestException(`Invalid status for check-in: ${booking.status}`);
      }

      const updated = await this.bookingsRepository.checkIn(id, client);

      // 0. Mark Bed as Occupied
      await this.bedsRepository.updateStatus(booking.bedId, BedStatus.OCCUPIED, client);

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

      const checkInUndoLog = await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.CHECK_IN_BOOKING,
          entityType: 'booking',
          entityId: id,
          undoData: {
            previousStatus: booking.status,
            previousCheckInDate: booking.checkedInAt,
            bedId: booking.bedId,
          },
          description: `Checked in booking ${id}`,
        },
        client,
      );

      this.logger.log({ bookingId: id, assignedCardNumber }, 'Check-in completed');
      // Notify student (fire-and-forget after commit)
      setImmediate(() =>
        this.notificationsService.create(
          booking.studentId,
          NotificationType.CHECKIN_CONFIRMED,
          'Check-In Confirmed',
          'Welcome! Your check-in has been confirmed. You can view your room details in your booking.',
          { bookingId: id, assignedCardNumber },
          checkInUndoLog.id,
        ),
      );
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
      const booking = await this.assertBookingInScope(id, context, client);

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

      // 3.1 Clear Gender Lock if room is empty
      const bed = await this.bedsRepository.findById(booking.bedId, client);
      if (bed) {
        await this.locationsRepository.clearGenderLockIfEmpty(bed.locationId, client);
      }

      // 4. Generate Check-Out Contract
      try {
        await this.contractsService.generateCheckOutContract(id, context.userId, client);
      } catch (contractError: any) {
        this.logger.error(
          { bookingId: id, error: contractError.message },
          'Failed to generate check-out contract',
        );
      }

      const checkOutUndoLog = await this.undoService.registerUndo(
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
      // Notify student (fire-and-forget after commit)
      setImmediate(() =>
        this.notificationsService.create(
          booking.studentId,
          NotificationType.CHECKOUT_PROCESSED,
          'Check-Out Processed',
          'Your check-out has been processed. Thank you for staying with us.',
          { bookingId: id },
          checkOutUndoLog.id,
        ),
      );
      return updated!;
    }, context);
  }

  async transferMany(dto: BulkTransferBookingDto, context: AuditUserContext): Promise<Booking[]> {
    this.logger.log(
      { count: dto.bookingIds.length, targetSemesterId: dto.targetSemesterId },
      'Bulk transferring bookings',
    );

    return this.db.transaction(async (client) => {
      // 1. Fetch Target Semester for Default Dates
      const semesterRes = await client.query(
        'SELECT start_date, end_date FROM semesters WHERE id = $1',
        [dto.targetSemesterId],
      );
      if (semesterRes.rowCount === 0) throw new NotFoundException('Target semester not found');
      const semester = semesterRes.rows[0];

      // 2. Resolve Dates (Shared for all transfers in this bulk operation if provided)
      const finalStartDate = dto.startDate || semester.start_date;
      const finalEndDate = dto.endDate || semester.end_date;

      if (new Date(finalStartDate) >= new Date(finalEndDate)) {
        throw new BadRequestException('Resolved start date must be before end date.');
      }

      const results: Booking[] = [];

      for (const id of dto.bookingIds) {
        const existing = await this.bookingsRepository.findById(id, client);
        if (!existing) {
          this.logger.warn({ bookingId: id }, 'Booking not found during bulk transfer, skipping');
          continue;
        }
        if (!context.locationScope?.unrestricted) {
          const treePath = await this.bookingsRepository.findLocationTreePath(id, client);
          this.locationScopeService.assertAccess(context.locationScope, treePath ?? '');
        }

        // 3. Check for existing transfer
        const duplicateRes = await client.query(
          'SELECT id FROM bookings WHERE previous_booking_id = $1',
          [id],
        );
        if (duplicateRes.rowCount! > 0) {
          this.logger.warn({ bookingId: id }, 'Booking already transferred, skipping');
          continue;
        }

        try {
          const newBooking = await this.bookingsRepository.create(
            {
              studentId: existing.studentId,
              bedId: existing.bedId,
              semesterId: dto.targetSemesterId,
              previousBookingId: id,
              startDate: finalStartDate,
              endDate: finalEndDate,
              status: BookingOpsStatus.PENDING_ACCOUNTING,
              paymentStatus: PaymentStatus.PENDING,
            },
            client,
          );

          // 4. Inventory Rollover: Clone snapshots from the old booking to the new one
          await this.inventoryService.cloneSnapshotsForBooking(id, newBooking.id, client);

          await this.undoService.registerUndo(
            {
              userId: context.userId,
              actionType: UndoActionType.CREATE_BOOKING,
              entityType: 'booking',
              entityId: newBooking.id,
              undoData: {},
              description: `Transferred booking ${id} to semester ${dto.targetSemesterId} (Bulk)`,
            },
            client,
          );

          results.push(newBooking);
        } catch (error: any) {
          if (error.code === '23P04') {
            this.logger.warn({ bookingId: id }, 'Bed already occupied for target dates, skipping');
            continue;
          }
          throw error;
        }
      }

      this.logger.log({ processed: results.length }, 'Bulk transfer completed');
      return results;
    }, context);
  }

  async transfer(
    id: string,
    data: TransferBookingDto,
    context: AuditUserContext,
  ): Promise<Booking> {
    this.logger.log(
      { bookingId: id, targetSemesterId: data.targetSemesterId },
      'Transferring booking',
    );

    return this.db.transaction(async (client) => {
      // 1. Fetch Existing Booking
      const existing = await this.assertBookingInScope(id, context, client);

      // 2. Fetch Target Semester for Default Dates (Consistency Fix: using client)
      const semesterRes = await client.query(
        'SELECT start_date, end_date FROM semesters WHERE id = $1',
        [data.targetSemesterId],
      );
      if (semesterRes.rowCount === 0) throw new NotFoundException('Target semester not found');
      const semester = semesterRes.rows[0];

      // 3. Resolve Dates
      const finalStartDate = data.startDate || semester.start_date;
      const finalEndDate = data.endDate || semester.end_date;

      if (new Date(finalStartDate) >= new Date(finalEndDate)) {
        throw new BadRequestException('Resolved start date must be before end date.');
      }

      // 4. Check for existing transfer
      const duplicateRes = await client.query(
        'SELECT id FROM bookings WHERE previous_booking_id = $1',
        [id],
      );
      if (duplicateRes.rowCount! > 0) {
        throw new BadRequestException('This booking has already been transferred/renewed.');
      }

      // 5. Create New Booking (Linked)
      try {
        const newBooking = await this.bookingsRepository.create(
          {
            studentId: existing.studentId,
            bedId: existing.bedId,
            semesterId: data.targetSemesterId,
            previousBookingId: id,
            startDate: finalStartDate,
            endDate: finalEndDate,
            status: BookingOpsStatus.PENDING_ACCOUNTING,
            paymentStatus: PaymentStatus.PENDING,
          },
          client,
        );

        // 6. Inventory Rollover: Clone snapshots from the old booking to the new one
        await this.inventoryService.cloneSnapshotsForBooking(id, newBooking.id, client);

        await this.undoService.registerUndo(
          {
            userId: context.userId,
            actionType: UndoActionType.CREATE_BOOKING,
            entityType: 'booking',
            entityId: newBooking.id,
            undoData: {},
            description: `Transferred booking ${id} to semester ${data.targetSemesterId}`,
          },
          client,
        );

        this.logger.log({ oldId: id, newId: newBooking.id }, 'Booking transferred successfully');
        return newBooking;
      } catch (error: any) {
        if (error.code === '23P04') {
          throw new BadRequestException('The bed is already booked for the target semester dates.');
        }
        throw error;
      }
    }, context);
  }

  async adjustDates(
    id: string,
    data: UpdateBookingDatesDto,
    context: AuditUserContext,
  ): Promise<Booking> {
    this.logger.log({ bookingId: id, data }, 'Adjusting booking dates');

    const toDateString = (d: Date | string) => {
      const date = typeof d === 'string' ? new Date(d) : d;
      // Use a 4-hour buffer to handle timezone shifts (e.g., 22:00Z -> 02:00 Local)
      const buffer = 4 * 60 * 60 * 1000;
      const shifted = new Date(date.getTime() + buffer);
      const year = shifted.getUTCFullYear();
      const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
      const day = String(shifted.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return this.db.transaction(async (client) => {
      const existing = await this.assertBookingInScope(id, context, client);

      // 1. Validate Date Order
      const newStart = data.startDate ? new Date(data.startDate) : existing.startDate;
      const newEnd = data.endDate ? new Date(data.endDate) : existing.endDate;

      if (newStart > newEnd) {
        throw new BadRequestException(`Start date must be before or equal to end date`);
      }

      // 2. Enforce "Golden Rule"
      const isFinal =
        existing.status === BookingOpsStatus.COMPLETED ||
        existing.status === BookingOpsStatus.CANCELLED ||
        existing.status === BookingOpsStatus.REJECTED;

      const existingStartStr = toDateString(existing.startDate);
      const existingEndStr = toDateString(existing.endDate);
      const inputStartStr = data.startDate ? toDateString(data.startDate) : null;
      const inputEndStr = data.endDate ? toDateString(data.endDate) : null;

      this.logger.debug(
        {
          bookingId: id,
          existingStartStr,
          inputStartStr,
          existingEndStr,
          inputEndStr,
        },
        'Date comparison details',
      );

      // Cannot change START DATE after check-in or if finalized
      if (inputStartStr && inputStartStr !== existingStartStr) {
        if (existing.status === BookingOpsStatus.ACTIVE || isFinal) {
          throw new BadRequestException(
            'Cannot change the start date of an active or finalized booking.',
          );
        }
      }

      // Cannot change END DATE if finalized
      if (inputEndStr && inputEndStr !== existingEndStr) {
        if (isFinal) {
          throw new BadRequestException('Cannot change the end date of a finalized booking.');
        }
      }

      const updated = await this.bookingsRepository.update(id, data, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_BOOKING,
          entityType: 'booking',
          entityId: id,
          undoData: existing,
          description: `Adjusted dates for booking ${id}`,
        },
        client,
      );

      return updated!;
    }, context);
  }

  async update(id: string, data: UpdateBookingDto, context: AuditUserContext): Promise<Booking> {
    this.logger.log({ bookingId: id, data }, 'Updating booking');

    return this.db.transaction(async (client) => {
      const existing = await this.assertBookingInScope(id, context, client);

      const updated = await this.bookingsRepository.update(id, data, client);

      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.UPDATE_BOOKING,
          entityType: 'booking',
          entityId: id,
          undoData: existing,
          description: `Updated booking ${id}`,
        },
        client,
      );

      return updated!;
    }, context);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleAutomaticTransitions() {
    this.logger.log('Checking for automatic booking transitions (Rollovers)...');
    const context: AuditUserContext = {
      userId: '00000000-0000-0000-0000-000000000000',
      username: 'system_cron',
      ipAddress: '127.0.0.1',
    };

    const results = await this.processSemesterTransitions(context);
    if (results.length > 0) {
      this.logger.log(
        `Automatically flipped ${results.length} bookings to ACTIVE for new semester`,
      );
    }
  }

  /**
   * THE FLIP: Atomic transition from Old Semester (ACTIVE -> TRANSFERRED)
   * to New Semester (CONFIRMED -> ACTIVE).
   */
  async processSemesterTransitions(context: AuditUserContext): Promise<Booking[]> {
    return this.db.transaction(async (client) => {
      // 1. Find ACTIVE bookings in semesters that have ALREADY ENDED
      const expiredBookingsRes = await client.query(`
        SELECT b.* 
        FROM bookings b
        JOIN semesters s ON b.semester_id = s.id
        WHERE b.status = 'active'
          AND s.end_date <= CURRENT_DATE
      `);

      const flipped: Booking[] = [];

      for (const oldBooking of expiredBookingsRes.rows) {
        // 2. Check if this student has a CONFIRMED booking for the NEXT term
        const nextBookingRes = await client.query(
          `SELECT * FROM bookings 
           WHERE previous_booking_id = $1 
             AND status = 'confirmed' 
           LIMIT 1`,
          [oldBooking.id],
        );

        if (nextBookingRes.rowCount === 0) {
          // No renewal found. Standard checkout logic would go here if automated,
          // but for now we only handle the Renewal Flip.
          continue;
        }

        const nextBooking = nextBookingRes.rows[0];

        // 3. PERFORM THE ATOMIC FLIP

        // A. Set Old -> TRANSFERRED
        await client.query(
          "UPDATE bookings SET status = 'transferred', checked_out_at = NOW(), updated_at = NOW() WHERE id = $1",
          [oldBooking.id],
        );

        // B. Set New -> ACTIVE
        const updatedNewRes = await client.query(
          "UPDATE bookings SET status = 'active', checked_in_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *",
          [nextBooking.id],
        );

        // C. Relink Access Card
        await this.accessCardsService.relinkCardForTransfer(
          oldBooking.id,
          nextBooking.id,
          oldBooking.student_id,
          context,
          client,
        );

        // D. Undo/Audit log
        await this.undoService.registerUndo(
          {
            userId: context.userId,
            actionType: UndoActionType.UPDATE_BOOKING,
            entityType: 'booking',
            entityId: nextBooking.id,
            undoData: { previousStatus: 'confirmed', oldBookingId: oldBooking.id },
            description: `Automatic rollover flip: ${oldBooking.id} (Transferred) -> ${nextBooking.id} (Active)`,
          },
          client,
        );

        flipped.push(new Booking(updatedNewRes.rows[0]));
      }

      return flipped;
    }, context);
  }
}
