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

      // 4. Can't request the bed you already have
      if (dto.requestedBedId === booking.bedId) {
        throw new BadRequestException('You are already assigned to this bed');
      }

      // 5. Validate the requested bed
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

      const isTr = student.nationalityCode === 'TR';
      if ((bed.isTrOnly || room.isTrOnly) && !isTr) {
        throw new BadRequestException('This bed is reserved for Turkish citizens only');
      }
      if ((bed.isForeignerOnly || room.isForeignerOnly) && isTr) {
        throw new BadRequestException('This bed is reserved for foreign students only');
      }
      if (room.genderLock && room.genderLock !== student.gender) {
        throw new BadRequestException(`This room is reserved for ${room.genderLock} students only`);
      }

      // 6. Check bed isn't already occupied in this semester
      const taken = await this.roomChangesRepo.isBedTaken(
        dto.requestedBedId,
        semesterId,
        undefined,
        client,
      );
      if (taken) {
        throw new ConflictException('This bed is already occupied');
      }

      // 7. Create request
      return this.roomChangesRepo.create(
        {
          bookingId: booking.id,
          studentId,
          semesterId,
          requestedBedId: dto.requestedBedId,
          currentBedId: booking.bedId,
          note: dto.note,
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

      if (dto.approved) {
        // Verify the target bed is still available (exclude current booking)
        const taken = await this.roomChangesRepo.isBedTaken(
          request.requestedBedId,
          request.semesterId,
          request.bookingId,
          client,
        );
        if (taken) {
          throw new ConflictException('The requested bed is no longer available');
        }

        // Move the booking to the new bed and increment counter
        await this.roomChangesRepo.moveBed(request.bookingId, request.requestedBedId, true, client);
      }

      const resolved = await this.roomChangesRepo.resolve(
        id,
        {
          approved: dto.approved,
          resolvedBy,
          rejectionReason: dto.rejectionReason,
        },
        client,
      );

      if (!resolved)
        throw new NotFoundException('Room change request not found or already resolved');

      // Notify student (fire-and-forget after commit)
      const notificationType = dto.approved
        ? NotificationType.ROOM_CHANGE_APPROVED
        : NotificationType.ROOM_CHANGE_REJECTED;
      const title = dto.approved ? 'Room Change Approved' : 'Room Change Rejected';
      const body = dto.approved
        ? 'Your room change request has been approved.'
        : `Your room change request was rejected${dto.rejectionReason ? ': ' + dto.rejectionReason : '.'}`;

      setImmediate(() =>
        this.notificationsService.create(request.studentId, notificationType, title, body, {
          roomChangeId: id,
          bookingId: request.bookingId,
        }),
      );

      return resolved;
    });
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
