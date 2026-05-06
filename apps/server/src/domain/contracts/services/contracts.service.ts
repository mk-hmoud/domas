import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { BookingsRepository } from '../../bookings/repositories/bookings.repository';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { InventoryRepository } from '../../inventory/repositories/inventory.repository';
import { BedsRepository } from '../../locations/repositories/beds.repository';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { DatabaseService } from '../../../core/database/database.service';
import { ContractsRepository } from '../repositories/contracts.repository';
import { StorageService } from '../../../common/storage/storage.service';
import { UsersRepository } from '../../users/repositories/users.repository';
import { ContractType } from '../../../common/enums/contract-type.enum';
import { DocumentTemplatesService } from '../../document-templates/services/document-templates.service';
import { PoolClient } from 'pg';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly studentsRepository: StudentsRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly bedsRepository: BedsRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly contractsRepository: ContractsRepository,
    private readonly storageService: StorageService,
    private readonly usersRepository: UsersRepository,
    private readonly db: DatabaseService,
    private readonly documentTemplatesService: DocumentTemplatesService,
  ) {}

  async generateCheckInContract(
    bookingId: string,
    staffUserId: string,
    client?: PoolClient,
  ): Promise<void> {
    const booking = await this.bookingsRepository.findById(bookingId, client);
    if (!booking) throw new NotFoundException('Booking not found');

    const student = await this.studentsRepository.findById(booking.studentId, client);
    const bed = await this.bedsRepository.findById(booking.bedId, client);
    if (!bed) throw new NotFoundException('Bed not found');

    const room = await this.locationsRepository.findById(bed.locationId, client);
    const snapshots = await this.inventoryRepository.findSnapshotsByBooking(bookingId, client);
    const staff = await this.usersRepository.findById(staffUserId, client);

    const managerRes = await this.db.query(`
      SELECT u.* FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Dorm Manager' AND u.is_active = TRUE
      LIMIT 1
    `);
    const manager = managerRes.rows[0];

    if (!student || !room) throw new NotFoundException('Missing booking details');

    const language = student.nationalityCode === 'TR' ? 'TR' : 'EN';
    const staffName = this.resolvePersonName(staff, 'Dormitory Administrator');
    const managerName = this.resolvePersonName(
      manager,
      language === 'TR' ? 'Konaklama Müdürü' : 'Housing Manager',
    );

    const pdfBuffer = await this.documentTemplatesService.renderPdf('check_in', language, {
      student: {
        fullName: `${student.firstName} ${student.lastName}`,
        studentNumber: student.studentNumber,
      },
      room: { name: room.name },
      bed: { label: bed.label },
      staff: { fullName: staffName },
      manager: { fullName: managerName },
      now: new Date().toLocaleString(language === 'TR' ? 'tr-TR' : 'en-US'),
      snapshots,
    });

    await this.contractsRepository.upsert(bookingId, ContractType.CHECK_IN, pdfBuffer, client);
    await this.bookingsRepository.update(bookingId, { contractSigned: true }, client);

    this.logger.log(`Check-in contract generated for booking ${bookingId}`);
  }

  async generateCheckOutContract(
    bookingId: string,
    staffUserId: string,
    client?: PoolClient,
  ): Promise<void> {
    const booking = await this.bookingsRepository.findById(bookingId, client);
    if (!booking) throw new NotFoundException('Booking not found');

    const student = await this.studentsRepository.findById(booking.studentId, client);
    const bed = await this.bedsRepository.findById(booking.bedId, client);
    const room = await this.locationsRepository.findById(bed!.locationId, client);
    const staff = await this.usersRepository.findById(staffUserId, client);

    const liabilitiesRes = await this.db.query(
      `SELECT
        dl.*,
        dr.description as report_description,
        COALESCE(cat.name_tr, snap.name_tr) as item_name_tr,
        COALESCE(cat.name_en, snap.name_en) as item_name_en
       FROM damage_liabilities dl
       JOIN damage_reports dr ON dl.damage_report_id = dr.id
       LEFT JOIN inventory_catalog cat ON dr.catalog_id = cat.id
       LEFT JOIN booking_inventory_snapshots snap ON dr.snapshot_id = snap.id
       WHERE dl.student_id = $1 AND dr.created_at BETWEEN $2 AND NOW()`,
      [booking.studentId, booking.checkedInAt || booking.startDate],
    );

    const managerRes = await this.db.query(`
      SELECT u.* FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Dorm Manager' AND u.is_active = TRUE
      LIMIT 1
    `);
    const manager = managerRes.rows[0];

    const semesterRes = await this.db.query(
      'SELECT deposit_amount_try, deposit_amount_foreign, foreign_currency_code FROM semesters WHERE id = $1',
      [booking.semesterId],
    );
    const semester = semesterRes.rows[0];

    const language = student!.nationalityCode === 'TR' ? 'TR' : 'EN';
    const isTR = language === 'TR';
    const liabilities = liabilitiesRes.rows;

    const totalDeposit = isTR
      ? Number(semester.deposit_amount_try)
      : Number(semester.deposit_amount_foreign);
    const totalDeductions = liabilities.reduce((acc, l) => acc + Number(l.amount), 0);
    const refundAmount = totalDeposit - totalDeductions;
    const currency = isTR ? 'TRY' : semester.foreign_currency_code;

    const staffName = this.resolvePersonName(staff, '.....................');
    const managerName = this.resolvePersonName(manager, 'Umut KAYIKCI');

    const pdfBuffer = await this.documentTemplatesService.renderPdf('check_out', language, {
      student: {
        fullName: `${student!.firstName} ${student!.lastName}`,
        studentNumber: student!.studentNumber,
      },
      room: { name: room!.name },
      bed: { label: bed!.label },
      staff: { fullName: staffName },
      manager: { fullName: managerName },
      now: new Date().toLocaleDateString(isTR ? 'tr-TR' : 'en-US'),
      liabilities,
      financials: { totalDeposit, totalDeductions, refundAmount, currency },
    });

    await this.contractsRepository.upsert(bookingId, ContractType.CHECK_OUT, pdfBuffer, client);
    this.logger.log(`Check-out contract generated for booking ${bookingId}`);
  }

  async getContract(
    bookingId: string,
    type: string,
  ): Promise<{ fileSize: number; buffer: Buffer }> {
    const contract = await this.contractsRepository.findById(bookingId, type);
    if (!contract) throw new NotFoundException('Contract not found');
    const buffer = await this.storageService.download(contract.storageKey);
    return { fileSize: contract.fileSize, buffer };
  }

  private resolvePersonName(person: any, fallback: string): string {
    if (!person) return fallback;
    if (person.firstName && person.lastName) return `${person.firstName} ${person.lastName}`;
    if (person.email) return person.email;
    return fallback;
  }
}
