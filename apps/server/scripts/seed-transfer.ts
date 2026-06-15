import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { StudentsService } from '../src/domain/students/services/students.service';
import { LocationsService } from '../src/domain/locations/services/locations.service';
import { BedsService } from '../src/domain/locations/services/beds.service';
import { SemestersService } from '../src/domain/semesters/services/semesters.service';
import { BookingsService } from '../src/domain/bookings/services/bookings.service';
import { UsersService } from '../src/domain/users/services/users.service';
import { InventoryService } from '../src/domain/inventory/services/inventory.service';
import { LocationType } from '../src/common/enums/location-type.enum';
import { SemesterStatus } from '../src/common/enums/semester-status.enum';
import { SemesterType } from '../src/common/enums/semester-type.enum';
import { GenderType } from '../src/common/enums/gender-type.enum';
import { BookingOpsStatus } from '../src/common/enums/booking-ops-status.enum';
import { PaymentStatus } from '../src/common/enums/payment-status.enum';
import { AuditUserContext } from '../src/common/interfaces/audit-user-context.interface';
import { InventoryScope } from '../src/common/enums/inventory-scope.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const studentsService = app.get(StudentsService);
  const locationsService = app.get(LocationsService);
  const bedsService = app.get(BedsService);
  const semestersService = app.get(SemestersService);
  const bookingsService = app.get(BookingsService);
  const usersService = app.get(UsersService);
  const inventoryService = app.get(InventoryService);
  const logger = new Logger('TransferSeed');

  const adminUser = await usersService.findByEmail('recovery_admin@dorm.com');
  if (!adminUser) {
    logger.error('Recovery admin not found. Please run npm run init:prod first.');
    await app.close();
    return;
  }

  const seedContext: AuditUserContext = {
    userId: adminUser.id,
    username: 'transfer_seed_script',
    ipAddress: '127.0.0.1',
    userAgent: 'Transfer Seed Script',
  };

  try {
    logger.log('Starting transfer test seeding...');

    // 1. Create Semesters
    const academicYear = '2025-2026';

    // Fall Semester (Source)
    let fallSemester = (await semestersService.findAll({ page: 1, limit: 100 })).data.find(
      (s) => s.academicYear === academicYear && s.type === SemesterType.FALL,
    );

    if (!fallSemester) {
      fallSemester = await semestersService.create(
        {
          type: SemesterType.FALL,
          academicYear: academicYear,
          startDate: '2025-09-01',
          endDate: '2026-01-20',
          status: SemesterStatus.ACTIVE,
          depositAmountTry: 5000,
          depositAmountForeign: 200,
          foreignCurrencyCode: 'EUR',
          roomChangeAmountTry: 0,
          roomChangeAmountForeign: 0,
        },
        seedContext,
      );
      logger.log('Created Fall 2025 (Active)');
    }

    // Spring Semester (Target)
    let springSemester = (await semestersService.findAll({ page: 1, limit: 100 })).data.find(
      (s) => s.academicYear === academicYear && s.type === SemesterType.SPRING,
    );

    if (!springSemester) {
      springSemester = await semestersService.create(
        {
          type: SemesterType.SPRING,
          academicYear: academicYear,
          startDate: '2026-02-10',
          endDate: '2026-06-25',
          status: SemesterStatus.OPEN,
          depositAmountTry: 5500,
          depositAmountForeign: 220,
          foreignCurrencyCode: 'EUR',
          roomChangeAmountTry: 0,
          roomChangeAmountForeign: 0,
        },
        seedContext,
      );
      logger.log('Created Spring 2026 (Open)');
    }

    // 2. Setup Locations & Inventory
    const allLocations = await locationsService.findAll({ page: 1, limit: 1000 });
    const universityRoot = allLocations.data.find((l) => l.type === LocationType.UNIVERSITY);

    let campus = allLocations.data.find((l) => l.name === 'Transfer Test Campus');
    if (!campus) {
      campus = await locationsService.create(
        {
          name: 'Transfer Test Campus',
          type: LocationType.CAMPUS,
          parentId: universityRoot!.id,
        },
        seedContext,
      );
    }

    let room = allLocations.data.find((l) => l.name === 'Transfer-Room-101');
    if (!room) {
      room = await locationsService.createRoomWithBeds(
        {
          name: 'Transfer-Room-101',
          type: LocationType.ROOM,
          parentId: campus.id,
          bedCount: 2,
          genderLock: GenderType.MALE,
        },
        seedContext,
      );
      logger.log('Created Room 101 for transfer tests');
    }

    // Ensure some inventory exists for rollover testing
    const catalog = await inventoryService.findAllCatalog();
    let desk = catalog.find((i) => i.nameEn === 'Transfer Desk');
    if (!desk) {
      desk = await inventoryService.createCatalog(
        {
          nameEn: 'Transfer Desk',
          nameTr: 'Transfer Masası',
          scope: InventoryScope.ROOM,
          basePriceTry: 1000,
          basePriceForeign: 30,
          foreignCurrencyCode: 'EUR',
        },
        seedContext,
      );
    }

    const roomAssignments = await inventoryService.findAssignmentsByLocation(room.id);
    if (!roomAssignments.find((a) => a.catalogId === desk!.id)) {
      await inventoryService.createAssignment(
        {
          catalogId: desk!.id,
          locationId: room.id,
          quantity: 1,
        },
        seedContext,
      );
    }

    const beds = await bedsService.findByLocation(room.id);

    // 3. Create Students and Active Fall Bookings
    const studentData = [
      {
        studentNumber: 'TR-001',
        firstName: 'Ali',
        lastName: 'Veli',
        gender: GenderType.MALE,
        nationalityCode: 'TR',
        nationalId: '11111111111',
        birthDate: '2005-01-01',
        birthPlace: 'Ankara',
        department: 'CS',
        email: 'ali@test.com',
      },
      {
        studentNumber: 'TR-002',
        firstName: 'Can',
        lastName: 'Yılmaz',
        gender: GenderType.MALE,
        nationalityCode: 'TR',
        nationalId: '22222222222',
        birthDate: '2005-02-02',
        birthPlace: 'Istanbul',
        department: 'CS',
        email: 'can@test.com',
      },
    ];

    for (let i = 0; i < studentData.length; i++) {
      let student = (await studentsService.findAll({ page: 1, limit: 100 })).data.find(
        (s) => s.studentNumber === studentData[i].studentNumber,
      );
      if (!student) {
        student = await studentsService.create(studentData[i], seedContext);
      }

      // Check if already has a booking for Fall
      const existingBookings = await bookingsService.findAll({ studentId: student.id });
      const hasFallBooking = existingBookings.find((b) => b.semesterId === fallSemester!.id);

      if (!hasFallBooking) {
        // Create Booking
        const booking = await bookingsService.create(
          {
            studentId: student.id,
            bedId: beds[i].id,
            semesterId: fallSemester!.id,
            startDate: new Date(fallSemester!.startDate).toISOString().split('T')[0],
            endDate: new Date(fallSemester!.endDate).toISOString().split('T')[0],
          },
          seedContext,
        );

        // Approve Financials
        await bookingsService.approveFinancials(
          booking.id,
          {
            approved: true,
            paymentStatus: PaymentStatus.PAID,
          },
          seedContext,
        );

        // Check In (Makes it ACTIVE and creates inventory snapshot)
        await bookingsService.checkIn(
          booking.id,
          {
            autoAssignCard: false,
          },
          seedContext,
        );

        logger.log(`Created & Checked-in Fall booking for ${student.firstName}`);
      }
    }

    logger.log('\u2705 Transfer Test Seed Finished!');
  } catch (error) {
    logger.error('Transfer Seeding failed', error);
  } finally {
    await app.close();
  }
}

bootstrap();
