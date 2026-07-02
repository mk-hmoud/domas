import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { BookingsRepository } from '../../bookings/repositories/bookings.repository';
import { BedsRepository } from '../../locations/repositories/beds.repository';
import { SemestersRepository } from '../../semesters/repositories/semesters.repository';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { ImportsRepository } from '../repositories/imports.repository';
import { DatabaseService } from '../../../core/database/database.service';
import { UndoService } from '../../audit/services/undo.service';
import { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { ImportResultDto, ImportRowResultDto, ImportStudentRowDto } from '../dto/bulk-import.dto';
import { GenderType } from '../../../common/enums/gender-type.enum';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { UndoActionType } from '../../../common/enums/undo-action-type.enum';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import * as XLSX from 'xlsx';

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(
    private readonly studentsRepository: StudentsRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly bedsRepository: BedsRepository,
    private readonly semestersRepository: SemestersRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly importsRepository: ImportsRepository,
    private readonly db: DatabaseService,
    private readonly undoService: UndoService,
  ) {}

  async bulkImport(
    options: { fileBuffer: Buffer; filename: string; dryRun: boolean; updateExisting: boolean },
    context: AuditUserContext,
  ): Promise<ImportResultDto> {
    const students = this.parseExcel(options.fileBuffer);
    const isDryRun = options.dryRun;

    if (isDryRun) {
      return this.validateImport(students, options.updateExisting, context);
    } else {
      return this.executeImport(students, options.filename, options.updateExisting, context);
    }
  }

  private parseExcel(buffer: Buffer): ImportStudentRowDto[] {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];

      return json.map((row) => ({
        studentNumber: String(row.studentNumber || row['Student Number'] || ''),
        firstName: String(row.firstName || row['First Name'] || ''),
        lastName: String(row.lastName || row['Last Name'] || ''),
        gender: (row.gender || row['Gender'] || '').toLowerCase() as GenderType,
        nationalityCode: String(row.nationalityCode || row['Nationality'] || 'TR'),
        nationalId: String(row.nationalId || row['National ID'] || ''),
        birthDate: row.birthDate || row['Birth Date'],
        department: String(row.department || row['Department'] || ''),
        email: row.email || row['Email'],
        phoneNumber: row.phoneNumber || row['Phone Number'],
        whatsappNumber: row.whatsappNumber || row['WhatsApp Number'],
        bedId: row.bedId ? Number(row.bedId) : undefined,
        semesterId: row.semesterId ? Number(row.semesterId) : undefined,
        startDate: row.startDate,
        endDate: row.endDate,
      }));
    } catch (error: any) {
      throw new BadRequestException(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Dry-run: Validates every row and checks for INTERNAL conflicts.
   */
  private async validateImport(
    students: ImportStudentRowDto[],
    updateExisting: boolean,
    context: AuditUserContext,
  ): Promise<ImportResultDto> {
    const results: ImportRowResultDto[] = [];
    let successful = 0;
    let failed = 0;

    // Trackers for internal file conflicts
    const seenStudentNumbers = new Set<string>();
    const seenNationalIds = new Set<string>();
    const seenBedAssignments = new Map<number, { start: Date; end: Date }[]>();

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const rowNum = i + 2;

      try {
        if (
          !student.studentNumber ||
          !student.nationalId ||
          !student.firstName ||
          !student.lastName
        ) {
          throw new Error('Student number, National ID, First Name, and Last Name are required');
        }

        // 1. Check for Internal File Conflicts
        if (seenStudentNumbers.has(student.studentNumber)) {
          throw new Error(`Duplicate student number in file: ${student.studentNumber}`);
        }
        if (seenNationalIds.has(student.nationalId)) {
          throw new Error(`Duplicate national ID in file: ${student.nationalId}`);
        }

        seenStudentNumbers.add(student.studentNumber);
        seenNationalIds.add(student.nationalId);

        // 2. Check Database for Existing Student
        const existing = await this.studentsRepository.findByStudentNumber(student.studentNumber);
        if (existing && !updateExisting) {
          results.push({
            row: rowNum,
            status: 'skipped',
            error: 'Student already exists in database',
            studentId: existing.id,
            data: student,
          });
          continue;
        }

        // 3. Validate Nationality
        const nationality = await this.importsRepository.validateNationality(
          student.nationalityCode,
        );
        if (!nationality) throw new Error(`Invalid nationality code: ${student.nationalityCode}`);

        // 3.1 Validate Department
        const department = await this.importsRepository.validateDepartment(student.department);
        if (!department) throw new Error(`Invalid department: ${student.department}`);

        // 4. Validate Booking & Internal Bed Conflicts
        if (student.bedId && student.semesterId) {
          const semester = await this.semestersRepository.findById(student.semesterId);
          if (!semester) throw new Error(`Semester ${student.semesterId} not found`);

          const startDate = student.startDate
            ? new Date(student.startDate)
            : new Date(semester.startDate);
          const endDate = student.endDate ? new Date(student.endDate) : new Date(semester.endDate);

          if (startDate >= endDate) throw new Error('Start date must be before end date');

          // Check for conflicts with OTHER rows in the same file
          const previousAssignments = seenBedAssignments.get(student.bedId) || [];
          for (const assignment of previousAssignments) {
            if (startDate < assignment.end && endDate > assignment.start) {
              throw new Error(`Bed conflict within file for Bed ${student.bedId}`);
            }
          }
          previousAssignments.push({ start: startDate, end: endDate });
          seenBedAssignments.set(student.bedId, previousAssignments);

          // Check Database for existing bookings
          const isAvailable = await this.bookingsRepository.checkAvailability(
            student.bedId,
            startDate,
            endDate,
          );
          if (!isAvailable)
            throw new Error(`Bed ${student.bedId} is already booked in database for these dates`);
        }

        results.push({ row: rowNum, status: 'success', data: student });
        successful++;
      } catch (error: any) {
        results.push({ row: rowNum, status: 'error', error: error.message, data: student });
        failed++;
      }
    }

    return {
      success: failed === 0,
      summary: {
        total: students.length,
        successful,
        failed,
        skipped: results.filter((r) => r.status === 'skipped').length,
      },
      results,
    };
  }

  /**
   * Execute: Atomic transaction, calling repositories directly.
   */
  private async executeImport(
    students: ImportStudentRowDto[],
    filename: string,
    updateExisting: boolean,
    context: AuditUserContext,
  ): Promise<ImportResultDto> {
    const validation = await this.validateImport(students, updateExisting, context);
    if (!validation.success) {
      throw new BadRequestException('Validation failed. Fix errors in Excel and re-upload.');
    }

    const batchId = crypto.randomUUID();
    const ctx = { ...context, operationContext: `bulk:students:import:${batchId}` };
    return this.db.transaction(async (client) => {
      await this.importsRepository.createBatch(
        {
          id: batchId,
          filename,
          uploadedBy: context.userId,
          totalRows: students.length,
        },
        client,
      );

      const results: ImportRowResultDto[] = [];
      const createdStudentIds: string[] = [];
      const createdBookingIds: string[] = [];
      let successful = 0;

      for (let i = 0; i < students.length; i++) {
        const studentData = students[i];
        const rowNum = i + 2;

        // 1. Upsert student via Repository
        let studentId: string;
        const existing = await this.studentsRepository.findByStudentNumber(
          studentData.studentNumber,
          client,
        );

        if (existing) {
          if (updateExisting) {
            await this.studentsRepository.update(
              existing.id,
              {
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                email: studentData.email,
                phoneNumber: studentData.phoneNumber,
                whatsappNumber: studentData.whatsappNumber,
                department: studentData.department,
              },
              client,
            );
            studentId = existing.id;
          } else {
            results.push({
              row: rowNum,
              status: 'skipped',
              studentId: existing.id,
              data: studentData,
            });
            continue;
          }
        } else {
          const created = await this.studentsRepository.create(
            {
              studentNumber: studentData.studentNumber,
              firstName: studentData.firstName,
              lastName: studentData.lastName,
              email: studentData.email,
              phoneNumber: studentData.phoneNumber,
              whatsappNumber: studentData.whatsappNumber,
              nationalId: studentData.nationalId,
              nationalityCode: studentData.nationalityCode,
              gender: studentData.gender,
              birthDate: studentData.birthDate,
              birthPlace: 'Imported',
              department: studentData.department,
            },
            context.userId,
            client,
          );
          studentId = created.id;
          createdStudentIds.push(studentId);
        }

        // 2. Create booking via Repository
        let bookingId: string | undefined;
        if (studentData.bedId && studentData.semesterId) {
          const semester = await this.semestersRepository.findById(studentData.semesterId, client);
          const startDate = studentData.startDate || (semester?.startDate as any);
          const endDate = studentData.endDate || (semester?.endDate as any);

          const booking = await this.bookingsRepository.create(
            {
              studentId,
              bedId: studentData.bedId,
              semesterId: studentData.semesterId,
              startDate,
              endDate,
              status: BookingOpsStatus.PENDING_ACCOUNTING,
              paymentStatus: PaymentStatus.PENDING,
            },
            client,
          );
          bookingId = booking.id;
          createdBookingIds.push(bookingId);

          // Apply dynamic gender lock
          const bed = await this.bedsRepository.findById(studentData.bedId, client);
          if (bed) {
            await this.locationsRepository.lockGenderIfNull(
              bed.locationId,
              studentData.gender,
              client,
            );
          }
        }

        results.push({ row: rowNum, status: 'success', studentId, bookingId, data: studentData });
        successful++;
      }

      // 3. Register ONE Master Undo Log
      await this.undoService.registerUndo(
        {
          userId: context.userId,
          actionType: UndoActionType.BULK_IMPORT_STUDENT,
          entityType: 'import_batch',
          entityId: batchId,
          undoData: {
            batchId,
            createdStudentIds,
            createdBookingIds,
          },
          description: `Bulk import: ${filename} (${successful} rows)`,
        },
        client,
      );

      await this.importsRepository.updateBatch(
        batchId,
        {
          successfulRows: successful,
          failedRows: 0,
          status: 'completed',
          results: results,
        },
        client,
      );

      return {
        success: true,
        batchId,
        summary: {
          total: students.length,
          successful,
          failed: 0,
          skipped: results.filter((r) => r.status === 'skipped').length,
        },
        results,
      };
    }, ctx);
  }
}
