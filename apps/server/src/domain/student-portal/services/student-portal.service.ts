import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { StudentPortalRepository } from '../repositories/student-portal.repository';
import { DatabaseService } from '../../../core/database/database.service';
import {
  NotificationsService,
  NotificationType,
} from '../../notifications/services/notifications.service';
import { Student } from '../../students/entities/student.entity';
import { UpdateStudentContactDto } from '../dto/update-student-contact.dto';
import { StudentCreateBookingDto } from '../dto/student-create-booking.dto';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

@Injectable()
export class StudentPortalService {
  constructor(
    private readonly studentsRepository: StudentsRepository,
    private readonly portalRepository: StudentPortalRepository,
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Auth ─────────────────────────────────────────────────────────────────────

  async loginByStudentNumber(studentNumber: string): Promise<Student> {
    const student = await this.studentsRepository.findByStudentNumber(studentNumber);
    if (!student || !student.isActive) {
      throw new UnauthorizedException('Student not found or inactive');
    }
    return student;
  }

  // ─── Profile ──────────────────────────────────────────────────────────────────

  async getProfile(studentId: string): Promise<Student> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async updateContact(studentId: string, dto: UpdateStudentContactDto): Promise<Student> {
    const updated = await this.studentsRepository.update(studentId, {
      email: dto.email,
      phoneNumber: dto.phoneNumber,
    });
    if (!updated) {
      throw new NotFoundException('Student not found');
    }
    return updated;
  }

  // ─── Semesters ────────────────────────────────────────────────────────────────

  async getBookableSemesters(): Promise<any[]> {
    return this.portalRepository.findBookableSemesters();
  }

  async getAvailableBedsForSemester(
    semesterId: number,
    studentId: string,
    roomTypeId?: number | null,
  ): Promise<any[]> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');

    const semester = await this.portalRepository.findSemesterById(semesterId);
    if (!semester || !['open', 'active'].includes(semester.status)) {
      throw new BadRequestException('Semester is not open for bookings');
    }

    return this.portalRepository.findAvailableBedsForSemester(
      semesterId,
      student.nationalityCode,
      student.gender,
      roomTypeId,
    );
  }

  async getBuildings(semesterId: number, studentId: string): Promise<any[]> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');

    const semester = await this.portalRepository.findSemesterById(semesterId);
    if (!semester || !['open', 'active'].includes(semester.status)) {
      throw new BadRequestException('Semester is not open for bookings');
    }

    return this.portalRepository.findBuildings(semesterId, student.nationalityCode, student.gender);
  }

  async getRoomCatalog(
    semesterId: number,
    studentId: string,
    buildingId?: number | null,
    capacity?: number | null,
  ): Promise<any[]> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');

    const semester = await this.portalRepository.findSemesterById(semesterId);
    if (!semester || !['open', 'active'].includes(semester.status)) {
      throw new BadRequestException('Semester is not open for bookings');
    }

    return this.portalRepository.findRoomCatalog(
      semesterId,
      student.nationalityCode,
      student.gender,
      buildingId,
      capacity,
    );
  }

  // ─── Bookings ─────────────────────────────────────────────────────────────────

  async getMyBookings(studentId: string): Promise<any[]> {
    return this.portalRepository.findBookingsByStudent(studentId);
  }

  async getCurrentBooking(studentId: string): Promise<any | null> {
    return this.portalRepository.findCurrentBookingByStudent(studentId);
  }

  async getBookingById(bookingId: string, studentId: string): Promise<any> {
    const booking = await this.portalRepository.findBookingByIdAndStudent(bookingId, studentId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async createBooking(studentId: string, dto: StudentCreateBookingDto): Promise<any> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');

    return this.db.transaction(async (client) => {
      // 1. Validate semester
      const semester = await this.portalRepository.findSemesterById(dto.semesterId);
      if (!semester || !['open', 'active'].includes(semester.status)) {
        throw new BadRequestException('This semester is not open for bookings');
      }

      // 2. Check booking window
      const now = new Date();
      if (semester.bookingStartDate && new Date(semester.bookingStartDate) > now) {
        throw new BadRequestException('The booking window has not opened yet');
      }
      if (semester.bookingEndDate && new Date(semester.bookingEndDate) < now) {
        throw new BadRequestException('The booking window has closed');
      }

      // 3. No duplicate booking for this semester
      const alreadyBooked = await this.portalRepository.hasActiveBookingForSemester(
        studentId,
        dto.semesterId,
      );
      if (alreadyBooked) {
        throw new ConflictException('You already have a booking for this semester');
      }

      // 4. Validate bed and room constraints
      const bedWithRoom = await this.portalRepository.findBedWithRoom(dto.bedId, client);
      if (!bedWithRoom) throw new NotFoundException('Bed not found');

      const { bed, room } = bedWithRoom;

      if (bed.status !== BedStatus.AVAILABLE) {
        throw new BadRequestException('This bed is not available');
      }
      if (bed.isGuestZone || room.isGuestZone) {
        throw new ForbiddenException('Guest zone beds are not available for student bookings');
      }
      if (
        bed.ownership === LocationOwnership.RECTORATE ||
        room.ownership === LocationOwnership.RECTORATE
      ) {
        throw new ForbiddenException('This bed is not available for student bookings');
      }

      const isTr = student.nationalityCode === 'TR';
      const isTrOnly = bed.isTrOnly || room.isTrOnly;
      const isForeignerOnly = bed.isForeignerOnly || room.isForeignerOnly;

      if (isTrOnly && !isTr) {
        throw new BadRequestException('This bed is reserved for Turkish citizens only');
      }
      if (isForeignerOnly && isTr) {
        throw new BadRequestException('This bed is reserved for foreign students only');
      }
      if (room.genderLock && room.genderLock !== student.gender) {
        throw new BadRequestException(`This room is reserved for ${room.genderLock} students only`);
      }

      // 5. Create the booking
      const booking = await this.portalRepository.createBooking(
        studentId,
        dto.bedId,
        dto.semesterId,
        semester.startDate,
        semester.endDate,
        client,
      );

      // 6. Lock room gender if not yet set
      await this.portalRepository.lockGenderIfNull(bed.locationId, student.gender, client);

      // 7. Notify the student (fire-and-forget after commit)
      setImmediate(() =>
        this.notificationsService.create(
          studentId,
          NotificationType.BOOKING_SUBMITTED,
          'Application Submitted',
          'Your accommodation application has been submitted and is under review.',
          { bookingId: booking.id, semesterId: dto.semesterId },
        ),
      );

      return booking;
    });
  }

  // ─── Financial ────────────────────────────────────────────────────────────────

  async getMyTransactions(studentId: string): Promise<any[]> {
    return this.portalRepository.findTransactionsByStudent(studentId);
  }

  async getMyDamageLiabilities(studentId: string): Promise<any[]> {
    return this.portalRepository.findDamageLiabilitiesByStudent(studentId);
  }
}
