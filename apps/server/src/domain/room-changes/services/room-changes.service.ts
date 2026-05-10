import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import {
  NotificationsService,
  NotificationType,
  NotificationTypeValue,
} from '../../notifications/services/notifications.service';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { RoomChangesRepository } from '../repositories/room-changes.repository';
import { StudentCreateRoomChangeDto } from '../dto/student-create-room-change.dto';
import { ResolveRoomChangeDto } from '../dto/resolve-room-change.dto';
import { StaffMoveBedDto } from '../dto/staff-move-bed.dto';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

@Injectable()
export class RoomChangesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly roomChangesRepo: RoomChangesRepository,
    private readonly studentsRepo: StudentsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Student Portal ───────────────────────────────────────────────────────────

  async getMyRequests(studentId: string): Promise<any[]> {
    return this.roomChangesRepo.findByStudent(studentId);
  }

  async createRequest(
    studentId: string,
    semesterId: number,
    dto: StudentCreateRoomChangeDto,
  ): Promise<any> {
    const student = await this.studentsRepo.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');

    return this.db.transaction(async (client) => {
      // 1. Find the student's active booking for this semester
      const booking = await this.roomChangesRepo.findActiveBookingForStudent(
        studentId,
        semesterId,
        client,
      );
      if (!booking) {
        throw new NotFoundException('No active booking found for this semester');
      }

      // 2. Check the limit
      if (booking.maxRoomChanges != null && booking.roomChangesCount >= booking.maxRoomChanges) {
        throw new BadRequestException(`Room change limit reached (${booking.maxRoomChanges})`);
      }

      // 3. No pending request already exists (DB constraint enforces this, but give a clear error)
      const existing = await this.roomChangesRepo.findPendingByBooking(booking.id, client);
      if (existing) {
        throw new ConflictException('You already have a pending room change request');
      }

      // 4. Can't request the bed you already have (only for specific requests)
      if (dto.requestedBedId != null && dto.requestedBedId === booking.bedId) {
        throw new BadRequestException('You are already assigned to this bed');
      }

      // 5–6. Validate the requested bed (skipped for open requests)
      const isTr = student.nationalityCode === 'TR';
      if (dto.requestedBedId != null) {
        const bedWithRoom = await this.roomChangesRepo.findBedWithRoom(dto.requestedBedId, client);
        if (!bedWithRoom) throw new NotFoundException('Requested bed not found');

        const { bed, room } = bedWithRoom;

        if (bed.status !== BedStatus.AVAILABLE) {
          throw new BadRequestException('The requested bed is not available');
        }
        if (bed.isGuestZone || room.isGuestZone) {
          throw new ForbiddenException('Guest zone beds are not available');
        }
        if (
          bed.ownership === LocationOwnership.RECTORATE ||
          room.ownership === LocationOwnership.RECTORATE
        ) {
          throw new ForbiddenException('This bed is not available for student bookings');
        }
        if ((bed.isTrOnly || room.isTrOnly) && !isTr) {
          throw new BadRequestException('This bed is reserved for Turkish citizens only');
        }
        if ((bed.isForeignerOnly || room.isForeignerOnly) && isTr) {
          throw new BadRequestException('This bed is reserved for foreign students only');
        }
        if (room.genderLock && room.genderLock !== student.gender) {
          throw new BadRequestException(
            `This room is reserved for ${room.genderLock} students only`,
          );
        }

        const taken = await this.roomChangesRepo.isBedTaken(
          dto.requestedBedId,
          semesterId,
          undefined,
          client,
        );
        if (taken) {
          throw new ConflictException('This bed is already occupied');
        }
      }

      // 7. Determine whether payment is required for this request
      let requiresPayment = false;
      let paymentAmount: number | null = null;
      let paymentCurrency: string | null = null;

      if (
        booking.paidRoomChangeAfter != null &&
        booking.roomChangesCount >= booking.paidRoomChangeAfter
      ) {
        requiresPayment = true;
        if (isTr) {
          paymentAmount = Number(booking.roomChangeAmountTry);
          paymentCurrency = 'TRY';
        } else {
          paymentAmount = Number(booking.roomChangeAmountForeign);
          paymentCurrency = booking.foreignCurrencyCode ?? 'EUR';
        }
      }

      // 8. Create request
      return this.roomChangesRepo.create(
        {
          bookingId: booking.id,
          studentId,
          semesterId,
          requestedBedId: dto.requestedBedId ?? null,
          currentBedId: booking.bedId,
          note: dto.note,
          requiresPayment,
          paymentAmount,
          paymentCurrency,
        },
        client,
      );
    });
  }

  async cancelRequest(id: string, studentId: string): Promise<void> {
    const deleted = await this.roomChangesRepo.deleteById(id, studentId);
    if (!deleted) {
      throw new NotFoundException('Pending room change request not found');
    }
  }

  // ─── Staff ────────────────────────────────────────────────────────────────────

  async getAll(params?: { semesterId?: number; status?: string }): Promise<any[]> {
    return this.roomChangesRepo.findAll(params);
  }

  async resolve(id: string, dto: ResolveRoomChangeDto, resolvedBy: string): Promise<any> {
    return this.db.transaction(async (client) => {
      const request = await this.roomChangesRepo.findById(id, client);
      if (!request) throw new NotFoundException('Room change request not found');
      if (request.status !== 'pending') {
        throw new BadRequestException('This request has already been resolved');
      }

      const isOpenRequest = request.requestedBedId == null;
      const effectiveBedId: number | undefined = isOpenRequest
        ? dto.assignedBedId
        : request.requestedBedId;

      if (dto.approved) {
        if (isOpenRequest && effectiveBedId == null) {
          throw new BadRequestException(
            'A bed must be assigned when approving an open room change request',
          );
        }

        const taken = await this.roomChangesRepo.isBedTaken(
          effectiveBedId!,
          request.semesterId,
          request.bookingId,
          client,
        );
        if (taken) {
          throw new ConflictException('The requested bed is no longer available');
        }

        if (!request.requiresPayment) {
          await this.roomChangesRepo.moveBed(request.bookingId, effectiveBedId!, true, client);
        }
      }

      const resolved = await this.roomChangesRepo.resolve(
        id,
        {
          approved: dto.approved,
          requiresPayment: request.requiresPayment,
          resolvedBy,
          rejectionReason: dto.rejectionReason,
          assignedBedId: isOpenRequest ? dto.assignedBedId : undefined,
        },
        client,
      );

      if (!resolved)
        throw new NotFoundException('Room change request not found or already resolved');

      let notificationType: NotificationTypeValue;
      let title: string;
      let body: string;

      if (!dto.approved) {
        notificationType = NotificationType.ROOM_CHANGE_REJECTED;
        title = 'Room Change Rejected';
        body = `Your room change request was rejected${dto.rejectionReason ? ': ' + dto.rejectionReason : '.'}`;
      } else if (request.requiresPayment) {
        notificationType = NotificationType.ROOM_CHANGE_PENDING_PAYMENT;
        title = 'Room Change Approved — Payment Required';
        body = `Your room change request has been approved. A fee of ${request.paymentAmount} ${request.paymentCurrency} is required and pending accounting confirmation.`;
      } else {
        notificationType = NotificationType.ROOM_CHANGE_APPROVED;
        title = 'Room Change Approved';
        body = 'Your room change request has been approved.';
      }

      setImmediate(() =>
        this.notificationsService.create(request.studentId, notificationType, title, body, {
          roomChangeId: id,
          bookingId: request.bookingId,
        }),
      );

      return resolved;
    });
  }

  async approvePayment(
    id: string,
    dto: { approved: boolean; rejectionReason?: string },
    approvedBy: string,
  ): Promise<any> {
    const request = await this.roomChangesRepo.findById(id);
    if (!request) throw new NotFoundException('Room change request not found');
    if (!request.requiresPayment) {
      throw new BadRequestException('This request does not require payment approval');
    }
    if (request.status !== 'pending_payment') {
      throw new BadRequestException(
        'This request is not awaiting payment approval (must be approved by staff first)',
      );
    }

    const result = await this.roomChangesRepo.approvePayment(id, {
      approved: dto.approved,
      approvedBy,
      rejectionReason: dto.rejectionReason,
    });

    if (!result) throw new NotFoundException('Room change request not found or cannot be updated');

    const notificationType = dto.approved
      ? NotificationType.ROOM_CHANGE_APPROVED
      : NotificationType.ROOM_CHANGE_REJECTED;
    const title = dto.approved ? 'Room Change Confirmed' : 'Room Change Cancelled';
    const body = dto.approved
      ? 'Your payment has been confirmed and your room change is complete.'
      : `Your room change was cancelled: ${dto.rejectionReason ?? 'Payment not confirmed'}.`;

    setImmediate(() =>
      this.notificationsService.create(request.studentId, notificationType, title, body, {
        roomChangeId: id,
        bookingId: request.bookingId,
      }),
    );

    return result;
  }

  async getAvailableBedsForBooking(bookingId: string): Promise<any[]> {
    return this.roomChangesRepo.findAvailableBedsForBooking(bookingId);
  }

  async staffMoveBed(bookingId: string, dto: StaffMoveBedDto): Promise<void> {
    return this.db.transaction(async (client) => {
      // Fetch booking to get semesterId
      const result = await client.query(
        `SELECT id, semester_id AS "semesterId", bed_id AS "bedId", status
         FROM bookings WHERE id = $1`,
        [bookingId],
      );
      const booking = result.rows[0];
      if (!booking) throw new NotFoundException('Booking not found');
      if (['cancelled', 'rejected', 'completed', 'transferred'].includes(booking.status)) {
        throw new BadRequestException('Cannot move bed on an inactive booking');
      }
      if (dto.bedId === booking.bedId) {
        throw new BadRequestException('The booking is already on this bed');
      }

      const taken = await this.roomChangesRepo.isBedTaken(
        dto.bedId,
        booking.semesterId,
        bookingId,
        client,
      );
      if (taken) throw new ConflictException('This bed is already occupied');

      // Move without incrementing counter
      await this.roomChangesRepo.moveBed(bookingId, dto.bedId, false, client);

      // Cancel any pending room change requests for this booking
      await client.query(
        `DELETE FROM room_change_requests WHERE booking_id = $1 AND status = 'pending'`,
        [bookingId],
      );
    });
  }
}
