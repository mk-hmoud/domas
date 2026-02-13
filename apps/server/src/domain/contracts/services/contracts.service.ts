import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { BookingsRepository } from '../../bookings/repositories/bookings.repository';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { InventoryRepository } from '../../inventory/repositories/inventory.repository';
import { BedsRepository } from '../../locations/repositories/beds.repository';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { DatabaseService } from '../../../core/database/database.service';
import { ContractsRepository } from '../repositories/contracts.repository';
import PDFDocument from 'pdfkit';
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
    private readonly db: DatabaseService,
  ) {}

  async generateCheckInContract(bookingId: string, client?: PoolClient): Promise<void> {
    const booking = await this.bookingsRepository.findById(bookingId, client);
    if (!booking) throw new NotFoundException('Booking not found');

    const student = await this.studentsRepository.findById(booking.studentId, client);
    const bed = await this.bedsRepository.findById(booking.bedId, client);
    if (!bed) throw new NotFoundException('Bed not found');

    const room = await this.locationsRepository.findById(bed.locationId, client);
    const snapshots = await this.inventoryRepository.findSnapshotsByBooking(bookingId, client);

    if (!student || !room || !bed) throw new NotFoundException('Missing booking details');

    const pdfBuffer = await this.createContractPdf(student, room, bed, booking, snapshots);

    await this.contractsRepository.upsert(bookingId, pdfBuffer, client);
    await this.bookingsRepository.update(bookingId, { contractSigned: true }, client);

    this.logger.log(`Contract generated for booking ${bookingId}`);
  }

  async getContractByBookingId(bookingId: string) {
    const contract = await this.contractsRepository.findByBookingId(bookingId);
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  private createContractPdf(
    student: any,
    room: any,
    bed: any,
    booking: any,
    snapshots: any[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- 1. HEADER ---
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('EUROPEAN UNIVERSITY OF LEFKE', { align: 'center' });
      doc.fontSize(12).text('Accommodation and Housing Management', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(14)
        .text('Campus Dormitory Inventory/Stock Contract', { align: 'center', underline: true });
      doc.moveDown();

      // --- 2. PREAMBLE ---
      doc.font('Helvetica').fontSize(10);
      const preamble =
        `${student.firstName} ${student.lastName} (Student ID: ${student.studentNumber}) ` +
        `who stays at EUL signed this contract with the supervision of the Dormitory Administrator, ` +
        `while taking over the dormitory room ${room.name}. ` +
        `The above mentioned student has to hand over that contract and the room to the dormitory administrator ` +
        `while leaving the dormitory. The cost of damages is cut from the deposit of the student ` +
        `according to the amounts specified below.`;

      doc.text(preamble, { align: 'justify' });
      doc.moveDown();

      // --- 3. INVENTORY TABLE ---
      doc.font('Helvetica-Bold').text('1. Inventory/Stock List', { underline: true });
      doc.moveDown(0.5);

      this.drawTable(doc, snapshots);

      doc.moveDown();

      // --- 4. EXPLANATION / NOTE ---
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text(
        'NOTE: To be paid in case the other inventory, the wall and the door paints get dirty and worn.',
      );
      doc.moveDown();

      // --- 5. DECLARATION ---
      const now = new Date();
      doc.font('Helvetica').fontSize(10);
      doc.text(
        `I took over the Room numbered ${room.name} (Bed: ${bed.label}) on ${now.toLocaleString()} ` +
          `taking the above mentioned issues into consideration.`,
        { align: 'justify' },
      );
      doc.moveDown(2);

      // --- 6. SIGNATURES ---
      const ySig = doc.y;

      // Column 1: Student
      doc.text('Recipient Student', 40, ySig);
      doc.text(`${student.firstName} ${student.lastName}`, 40, ySig + 15);
      doc.text(`ID: ${student.studentNumber}`, 40, ySig + 30);
      doc.text('Signature: ....................', 40, ySig + 55);

      // Column 2: Administrator
      doc.text('Dormitory Administrator', 200, ySig);
      doc.text('Dormitory Admin', 200, ySig + 15);
      doc.text('Signature: ....................', 200, ySig + 55);

      // Column 3: Manager
      doc.text('Housing Manager', 380, ySig);
      doc.text('Housing Manager', 380, ySig + 15);
      doc.text('Signature: ....................', 380, ySig + 55);

      doc.end();
    });
  }

  private drawTable(doc: PDFKit.PDFDocument, items: any[]) {
    let y = doc.y;
    const startX = 40;
    const colName = 40;
    const colPrefix = 300;
    const colQty = 380;
    const colCheck = 440;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Item Name', colName, y);
    doc.text('Scope', colPrefix, y);
    doc.text('Qty', colQty, y);
    doc.text('Check', colCheck, y);

    y += 15;
    doc.moveTo(startX, y).lineTo(550, y).stroke();
    y += 5;

    doc.font('Helvetica');
    items.forEach((item, i) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const prefix = item.scope === 'bed' ? 'Pers' : 'Room';
      const itemName = item.nameEn || item.nameTr;

      if (i % 2 === 0) {
        doc
          .rect(startX, y - 2, 510, 14)
          .fillColor('#f5f5f5')
          .fill()
          .fillColor('black');
      }

      doc.text(itemName, colName + 5, y);
      doc.text(prefix, colPrefix, y);
      doc.text(item.quantity.toString(), colQty, y);
      doc.rect(colCheck, y, 10, 10).stroke();

      y += 14;
    });

    doc.moveTo(startX, y).lineTo(550, y).stroke();
    doc.y = y + 10;
  }
}
