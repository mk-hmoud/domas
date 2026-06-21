import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { StudentsService } from '../src/domain/students/services/students.service';
import { LocationsService } from '../src/domain/locations/services/locations.service';
import { SemestersService } from '../src/domain/semesters/services/semesters.service';
import { RoomTypesService } from '../src/domain/room-types/services/room-types.service';
import { InventoryService } from '../src/domain/inventory/services/inventory.service';
import { AccessCardsService } from '../src/domain/access-cards/services/access-cards.service';
import { UsersService } from '../src/domain/users/services/users.service';
import { LocationType } from '../src/common/enums/location-type.enum';
import { SemesterStatus } from '../src/common/enums/semester-status.enum';
import { SemesterType } from '../src/common/enums/semester-type.enum';
import { InventoryScope } from '../src/common/enums/inventory-scope.enum';
import { GenderType } from '../src/common/enums/gender-type.enum';
import { AuditUserContext } from '../src/common/interfaces/audit-user-context.interface';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const studentsService = app.get(StudentsService);
  const locationsService = app.get(LocationsService);
  const semestersService = app.get(SemestersService);
  const roomTypesService = app.get(RoomTypesService);
  const inventoryService = app.get(InventoryService);
  const accessCardsService = app.get(AccessCardsService);
  const usersService = app.get(UsersService);
  const logger = new Logger('SeedScript');

  const adminUser = await usersService.findByEmail('recovery_admin@dorm.com');
  if (!adminUser) {
    logger.error('Recovery admin not found. Please run npm run init:prod first.');
    await app.close();
    return;
  }

  const seedContext: AuditUserContext = {
    userId: adminUser.id,
    username: 'seed_script',
    ipAddress: '127.0.0.1',
    userAgent: 'Seed Script',
    locationScope: { unrestricted: true, treePaths: [] },
  };

  try {
    logger.log('Starting database seeding...');

    // 1. Create Active Semester
    logger.log('Checking Semester...');
    const academicYear = '2025-2026';
    const semesters = await semestersService.findAll({ page: 1, limit: 100 });
    let semester = semesters.data.find(
      (s) => s.academicYear === academicYear && s.type === SemesterType.SPRING,
    );

    if (!semester) {
      semester = await semestersService.create(
        {
          type: SemesterType.SPRING,
          academicYear: academicYear,
          startDate: '2026-02-01',
          endDate: '2026-06-14',
          bookingStartDate: '2026-01-23',
          bookingEndDate: '2026-05-15',
          status: SemesterStatus.ACTIVE,
          depositAmountTry: 6000,
          depositAmountForeign: 250,
          foreignCurrencyCode: 'EUR',
          maxRoomChanges: 3,
          paidRoomChangeAfter: 2,
          roomChangeAmountTry: 500,
          roomChangeAmountForeign: 50,
        },
        seedContext,
      );
      logger.log(`Created Active Semester: ${academicYear} Spring`);
    } else {
      logger.log(`Semester ${academicYear} Spring already exists.`);
    }

    // 2. Create Room Types
    logger.log('Checking Room Types...');
    const existingRoomTypes = await roomTypesService.findAll();

    const getOrCreateRoomType = async (name: string, capacity: number, description?: string) => {
      const existing = existingRoomTypes.find((rt) => rt.name === name);
      if (existing) return existing;
      const rt = await roomTypesService.create({
        name,
        capacity,
        description,
        galleryUrls: [],
        amenities: [],
      });
      logger.log(`Created room type: ${name} (capacity: ${capacity})`);
      return rt;
    };

    const singleRoomType = await getOrCreateRoomType(
      'Standard Single',
      1,
      'Private single-occupancy room',
    );
    const tripleRoomType = await getOrCreateRoomType(
      'Standard Triple',
      3,
      'Shared 3-person room with individual study desks',
    );

    // 2b. Set semester pricing for room types
    logger.log('Checking Semester Pricing...');
    const existingPricing = await semestersService.getPricing(semester.id);
    if (existingPricing.every((row) => row.priceTry === null)) {
      await semestersService.setPricing(semester.id, {
        items: [
          { roomTypeId: singleRoomType.id, priceTry: 18000, priceForeign: 500 },
          { roomTypeId: tripleRoomType.id, priceTry: 12000, priceForeign: 330 },
        ],
      });
      logger.log('Set semester pricing for room types.');
    } else {
      logger.log('Semester pricing already set.');
    }

    // 3. Create Locations
    logger.log('Checking Locations...');
    const allLocations = await locationsService.findAll({ page: 1, limit: 1000 }, seedContext);

    // Find the absolute root created by init:prod
    const universityRoot = allLocations.data.find(
      (l) => l.name === 'University' && l.type === LocationType.UNIVERSITY,
    );
    if (!universityRoot) {
      logger.error('Root location "University" not found. Please run npm run init:prod first.');
      await app.close();
      return;
    }

    let campus = allLocations.data.find((l) => l.name === 'EUL Main Campus');
    if (!campus) {
      campus = await locationsService.create(
        {
          name: 'EUL Main Campus',
          type: LocationType.CAMPUS,
          parentId: universityRoot.id,
        },
        seedContext,
      );
      logger.log('Created EUL Main Campus under University.');
    }

    let building = allLocations.data.find((l) => l.name === 'Building North');
    if (!building) {
      building = await locationsService.create(
        { name: 'Building North', type: LocationType.BUILDING, parentId: campus.id },
        seedContext,
      );
      logger.log('Created Building.');
    }

    let floor = allLocations.data.find((l) => l.name === 'Floor 2');
    if (!floor) {
      floor = await locationsService.create(
        { name: 'Floor 2', type: LocationType.FLOOR, parentId: building.id },
        seedContext,
      );
      logger.log('Created Floor.');
    }

    let room201 = allLocations.data.find((l) => l.name === 'Room 201');
    if (!room201) {
      room201 = await locationsService.createRoomWithBeds(
        {
          name: 'Room 201',
          type: LocationType.ROOM,
          parentId: floor.id,
          bedCount: 3,
          genderLock: GenderType.MALE,
          roomTypeId: tripleRoomType.id,
        },
        seedContext,
      );
      logger.log('Created Room 201 (Standard Triple).');
    }

    let room202 = allLocations.data.find((l) => l.name === 'Room 202');
    if (!room202) {
      room202 = await locationsService.createRoomWithBeds(
        {
          name: 'Room 202',
          type: LocationType.ROOM,
          parentId: floor.id,
          bedCount: 1,
          genderLock: GenderType.FEMALE,
          roomTypeId: singleRoomType.id,
        },
        seedContext,
      );
      logger.log('Created Room 202 (Standard Single).');
    }

    // 4. Access Cards
    logger.log('Checking Access Cards...');
    const batches = await accessCardsService.findAllBatches(seedContext);
    if (!batches.find((b) => b.name === 'General Pool 2025')) {
      await accessCardsService.createBatch(
        {
          rangeStart: 0,
          rangeEnd: 100,
          locationId: building.id,
        },
        seedContext,
      );
      logger.log('Created Card Batch 0-100.');
    } else {
      logger.log('Card Batch already exists.');
    }

    // 5. Students
    logger.log('Checking Students...');
    const students = await studentsService.findAll({ page: 1, limit: 100 }, seedContext);

    if (!students.data.find((s) => s.studentNumber === '20251001')) {
      await studentsService.create(
        {
          studentNumber: '20251001',
          firstName: 'Mehmet',
          lastName: 'Yılmaz',
          gender: GenderType.MALE,
          nationalityCode: 'TR',
          nationalId: '10000000042',
          birthDate: '2004-08-12',
          birthPlace: 'Lefkoşa',
          department: 'Software Engineering',
          email: 'mehmet@example.com',
          phoneNumber: '+905551234567',
          whatsappNumber: '+905551234567',
        },
        seedContext,
      );
      logger.log('Created Mehmet.');
    }

    if (!students.data.find((s) => s.studentNumber === '20252001')) {
      await studentsService.create(
        {
          studentNumber: '20252001',
          firstName: 'Sarah',
          lastName: 'Connor',
          gender: GenderType.FEMALE,
          nationalityCode: 'GB',
          nationalId: 'UK99887766',
          birthDate: '2005-01-30',
          birthPlace: 'London',
          department: 'Cyber Security',
          email: 'sarah.c@example.com',
          phoneNumber: '+447700900123',
          whatsappNumber: '+447700900123',
        },
        seedContext,
      );
      logger.log('Created Sarah.');
    }

    // 6. Inventory Catalog
    logger.log('Checking Inventory Catalog...');
    const catalog = await inventoryService.findAllCatalog();

    const getOr创造 = async (nameEn: string, data: any) => {
      const existing = catalog.find((i) => i.nameEn === nameEn);
      if (existing) return existing;
      return inventoryService.createCatalog(data, seedContext);
    };

    const oven = await getOr创造('Electric Oven', {
      nameEn: 'Electric Oven',
      nameTr: 'Elektrikli Fırın',
      scope: InventoryScope.SHARED,
      basePriceTry: 8000,
      basePriceForeign: 220,
      foreignCurrencyCode: 'EUR',
    });

    const desk = await getOr创造('Study Desk', {
      nameEn: 'Study Desk',
      nameTr: 'Çalışma Masası',
      scope: InventoryScope.ROOM,
      basePriceTry: 1500,
      basePriceForeign: 40,
      foreignCurrencyCode: 'EUR',
    });

    await getOr创造('Standard Bed', {
      nameEn: 'Standard Bed',
      nameTr: 'Standart Yatak',
      scope: InventoryScope.BED,
      basePriceTry: 2500,
      basePriceForeign: 70,
      foreignCurrencyCode: 'EUR',
    });

    await getOr创造('Orthopedic Pillow', {
      nameEn: 'Orthopedic Pillow',
      nameTr: 'Ortopedik Yastık',
      scope: InventoryScope.BED,
      basePriceTry: 400,
      basePriceForeign: 12,
      foreignCurrencyCode: 'EUR',
      isOptional: true,
    });
    logger.log('Inventory Catalog checked/created.');

    // 7. Inventory Templates
    logger.log('Checking Inventory Templates...');
    const allTemplates = await inventoryService.findAllTemplates();
    const updatedCatalog = await inventoryService.findAllCatalog();

    const findCatalogId = (nameEn: string) => updatedCatalog.find((i) => i.nameEn === nameEn)?.id;

    if (!allTemplates.find((t) => t.name === 'Standard Single Bed')) {
      const bedId = findCatalogId('Standard Bed');
      if (bedId) {
        await inventoryService.createTemplate(
          {
            name: 'Standard Single Bed',
            description: 'Basic items for one bed',
            scope: InventoryScope.BED,
            items: [{ catalogId: bedId, quantity: 1 }],
          },
          seedContext,
        );
        logger.log('Created Standard Single Bed Template.');
      }
    }

    if (!allTemplates.find((t) => t.name === 'Standard Triple Room')) {
      const deskId = findCatalogId('Study Desk');
      if (deskId) {
        await inventoryService.createTemplate(
          {
            name: 'Standard Triple Room',
            description: 'Furniture for a 3-person room',
            scope: InventoryScope.ROOM,
            items: [{ catalogId: deskId, quantity: 3 }],
          },
          seedContext,
        );
        logger.log('Created Standard Triple Room Template.');
      }
    }

    // 8. Assign Inventory
    logger.log('Checking Assignments...');
    const floorAssignments = await inventoryService.findAssignmentsByLocation(
      floor.id,
      seedContext,
    );
    if (!floorAssignments.find((a) => a.catalogId === oven.id)) {
      await inventoryService.createAssignment(
        {
          catalogId: oven.id,
          locationId: floor.id,
          quantity: 1,
        },
        seedContext,
      );
      logger.log('Assigned Oven to Floor.');
    }

    const room201Assignments = await inventoryService.findAssignmentsByLocation(
      room201.id,
      seedContext,
    );
    if (!room201Assignments.find((a) => a.catalogId === desk.id)) {
      await inventoryService.createAssignment(
        {
          catalogId: desk.id,
          locationId: room201.id,
          quantity: 3,
        },
        seedContext,
      );
      logger.log('Assigned Desks to Room 201.');
    }

    logger.log('\u2705 Database seeding process finished!');
  } catch (error) {
    logger.error('Seeding failed', error);
  } finally {
    await app.close();
  }
}

bootstrap();
