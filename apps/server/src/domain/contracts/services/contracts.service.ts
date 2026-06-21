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
import PDFDocument from 'pdfkit';
import { PoolClient } from 'pg';
import * as path from 'path';
import { isTurkishNational } from '../../../common/utils/nationality.utils';
import { DocumentTemplatesService } from '../../document-templates/services/document-templates.service';
import {
  DOCUMENT_LANGUAGES,
  DOCUMENT_TYPES,
} from '../../document-templates/constants/document-types';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);
  private readonly fontPath = path.join(process.cwd(), 'src/assets/fonts/Roboto-Regular.ttf');
  private readonly fontBoldPath = path.join(process.cwd(), 'src/assets/fonts/Roboto-Bold.ttf');

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

  private resolvePersonName(person: any, fallback: string): string {
    if (!person) return fallback;
    if (person.firstName && person.lastName) return `${person.firstName} ${person.lastName}`;
    return person.email || fallback;
  }

  private buildCheckInContext(
    student: any,
    room: any,
    bed: any,
    snapshots: any[],
    staff: any,
    manager: any,
  ): Record<string, unknown> {
    const isTR = isTurkishNational(student.nationalityCode);
    return {
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        studentNumber: student.studentNumber,
        nationalId: student.nationalId,
      },
      isTR,
      room: { name: room.name },
      bed: { label: bed.label },
      staffName: this.resolvePersonName(
        staff,
        isTR ? 'Yurt Yöneticisi' : 'Dormitory Administrator',
      ),
      managerName: this.resolvePersonName(manager, isTR ? 'Konaklama Müdürü' : 'Housing Manager'),
      items: snapshots.map((s) => ({
        nameTr: s.nameTr,
        nameEn: s.nameEn,
        scope: s.scope,
        quantity: s.quantity,
      })),
      issueDate: new Date().toLocaleDateString(isTR ? 'tr-TR' : 'en-GB'),
    };
  }

  private buildCheckOutContext(
    student: any,
    room: any,
    bed: any,
    liabilities: any[],
    staff: any,
    manager: any,
    financials: {
      totalDeposit: number;
      totalDeductions: number;
      refundAmount: number;
      currency: string;
    },
  ): Record<string, unknown> {
    const isTR = isTurkishNational(student.nationalityCode);
    return {
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        studentNumber: student.studentNumber,
      },
      isTR,
      room: { name: room.name },
      bed: { label: bed.label },
      staffName: this.resolvePersonName(staff, '....................'),
      managerName: this.resolvePersonName(manager, 'Umut KAYIKCI'),
      liabilities: liabilities.map((l) => ({
        description: (isTR ? l.item_name_tr : l.item_name_en) || l.report_description,
        amount: l.amount,
        currency: l.currency,
      })),
      totalDeposit: financials.totalDeposit,
      totalDeductions: financials.totalDeductions,
      refundAmount: financials.refundAmount,
      currency: financials.currency,
      issueDate: new Date().toLocaleDateString(isTR ? 'tr-TR' : 'en-GB'),
    };
  }

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

    // Fetch any user with 'Dorm Manager' role for the manager signature
    const managerRes = await this.db.query(`
      SELECT u.* FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Dorm Manager' AND u.is_active = TRUE
      LIMIT 1
    `);
    const manager = managerRes.rows[0];

    if (!student || !room || !bed) throw new NotFoundException('Missing booking details');

    const language = isTurkishNational(student.nationalityCode)
      ? DOCUMENT_LANGUAGES.TURKISH
      : DOCUMENT_LANGUAGES.ENGLISH;
    const activeTemplate = await this.documentTemplatesService.findActiveByType(
      DOCUMENT_TYPES.CHECK_IN_CONTRACT,
      language,
    );
    const pdfBuffer = activeTemplate
      ? await this.documentTemplatesService.render(
          activeTemplate,
          this.buildCheckInContext(student, room, bed, snapshots, staff, manager),
        )
      : await this.createContractPdf(student, room, bed, booking, snapshots, staff, manager);

    await this.contractsRepository.upsert(
      bookingId,
      ContractType.CHECK_IN,
      pdfBuffer,
      client,
      activeTemplate?.id,
    );
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

    const isTR = isTurkishNational(student!.nationalityCode);

    // Fetch liabilities for this student that might be linked to this booking/stay
    const liabilitiesRes = await this.db.query(
      `
      SELECT 
        dl.*, 
        dr.description as report_description,
        COALESCE(cat.name_tr, snap.name_tr) as item_name_tr,
        COALESCE(cat.name_en, snap.name_en) as item_name_en
      FROM damage_liabilities dl
      JOIN damage_reports dr ON dl.damage_report_id = dr.id
      LEFT JOIN inventory_catalog cat ON dr.catalog_id = cat.id
      LEFT JOIN booking_inventory_snapshots snap ON dr.snapshot_id = snap.id
      WHERE dl.student_id = $1 AND dr.created_at BETWEEN $2 AND NOW()
    `,
      [booking.studentId, booking.checkedInAt || booking.startDate],
    );
    const liabilities = liabilitiesRes.rows;

    const managerRes = await this.db.query(`
      SELECT u.* FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Dorm Manager' AND u.is_active = TRUE
      LIMIT 1
    `);
    const manager = managerRes.rows[0];

    // Fetch Semester Deposit Info
    const semesterRes = await this.db.query(
      'SELECT deposit_amount_try, deposit_amount_foreign, foreign_currency_code FROM semesters WHERE id = $1',
      [booking.semesterId],
    );
    const semester = semesterRes.rows[0];

    const totalDeductions = liabilities.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalDeposit = isTR
      ? Number(semester.deposit_amount_try)
      : Number(semester.deposit_amount_foreign);
    const refundAmount = totalDeposit - totalDeductions;
    const currency = isTR ? 'TRY' : semester.foreign_currency_code;

    const financials = { totalDeposit, totalDeductions, refundAmount, currency };

    const activeTemplate = await this.documentTemplatesService.findActiveByType(
      DOCUMENT_TYPES.CHECK_OUT_CONTRACT,
      isTR ? DOCUMENT_LANGUAGES.TURKISH : DOCUMENT_LANGUAGES.ENGLISH,
    );
    const pdfBuffer = activeTemplate
      ? await this.documentTemplatesService.render(
          activeTemplate,
          this.buildCheckOutContext(student, room, bed, liabilities, staff, manager, financials),
        )
      : await this.createCheckOutPdf(
          student,
          room,
          bed,
          booking,
          liabilities,
          staff,
          manager,
          financials,
        );

    await this.contractsRepository.upsert(
      bookingId,
      ContractType.CHECK_OUT,
      pdfBuffer,
      client,
      activeTemplate?.id,
    );
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

  private createCheckOutPdf(
    student: any,
    room: any,
    bed: any,
    booking: any,
    liabilities: any[],
    staff: any,
    manager: any,
    financials: {
      totalDeposit: number;
      totalDeductions: number;
      refundAmount: number;
      currency: string;
    },
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const isTR = isTurkishNational(student.nationalityCode);
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      // Register fonts
      doc.registerFont('Custom-Regular', this.fontPath);
      doc.registerFont('Custom-Bold', this.fontBoldPath);

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const staffName = staff
        ? staff.firstName && staff.lastName
          ? `${staff.firstName} ${staff.lastName}`
          : staff.email
        : '....................';
      const managerName = manager
        ? manager.firstName && manager.lastName
          ? `${manager.firstName} ${manager.lastName}`
          : manager.email
        : 'Umut KAYIKCI';

      // --- HEADER ---
      doc
        .font('Custom-Bold')
        .fontSize(12)
        .text('EUROPEAN UNIVERSITY OF LEFKE', { align: 'center' });
      doc
        .fontSize(10)
        .text(isTR ? 'Konaklama ve Yurt Yönetimi' : 'Accommodation and Housing Management', {
          align: 'center',
        });
      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .text(
          isTR
            ? 'Yurt Çıkış ve Depozito İadesi Müracaat Formu'
            : 'Released Dormitories and Deposit Refund Application Form',
          { align: 'center', underline: true },
        );
      doc.moveDown();

      const lineGap = 15;
      const col1 = 40;
      const col2 = 300;

      // --- SECTION 1: STUDENT ---
      doc
        .font('Custom-Bold')
        .fontSize(10)
        .text(
          isTR ? '(1) Öğrenci Tarafından Doldurulacaktır.' : '(1) Will be filled by the Student.',
        );
      doc.font('Custom-Regular').fontSize(9);

      const preamble = isTR
        ? `Ben, Üniversitenin Lefke Merkez Yurdu nda kalan ${student.studentNumber} no lu öğrenci 2025-2026 / 1 ders yılı tatil / eve taşınma / diğer sebepler nedeniyle yurttan ayrılacağımdan yurt depozitomun iadesini / yurt borcuna aktarılmasını / kayıt harcına aktarılması için gereğini arz ederim.`
        : `I staying in the university Lefke Center Dormitory students ${student.studentNumber} No. 2025-2026 / 2 academic of the year holiday / move house / I will leave the dormitory / residence for reasons other refund of my deposit / transfer to the dorm debt / registration fees would be transferred to the need for offering.`;

      doc.text(preamble, { align: 'justify' });
      doc.moveDown(0.5);
      doc.text(
        `${isTR ? 'Öğrenci Adı Soyadı' : 'Student Name Surname'}: ${student.firstName} ${student.lastName}`,
      );
      doc.text(
        `${isTR ? 'Tarih' : 'Date'}: ${new Date().toLocaleDateString()}   ${isTR ? 'İmza' : 'Signature'}: ............................`,
      );
      doc.moveDown();

      // --- SECTION 2: DORMITORY OFFICERS ---
      doc
        .font('Custom-Bold')
        .text(
          isTR
            ? '(2) Yurt Sorumlusu Tarafından Doldurulacaktır.'
            : '(2) Will be filled by Dormitory Officers.',
        );
      doc.font('Custom-Regular');

      const officerText = isTR
        ? `${student.firstName} ${student.lastName} isimli, ${student.studentNumber} kayıt nolu öğrenci Lefke Merkez Yurdu, ${room.name} / ${bed.label} nolu odasında kalmış olduğu süre içerisinde oluşan eksiklik / hasar vardır / yoktur.`
        : `${student.firstName} ${student.lastName} with registration number ${student.studentNumber}, the student named EUL Lefke Center Dormitory stayed in room number ${room.name} / ${bed.label} which was formed in the lack of time / damage is / are not available.`;

      doc.text(officerText, { align: 'justify' });
      doc.moveDown(0.5);
      doc.text(
        `${isTR ? 'Yurt Sorumlusunun Adı Soyadı' : 'Dormitory Officer Name Surname'}: ${staffName}`,
      );
      doc.text(
        `${isTR ? 'Tarih' : 'Date'}: ${new Date().toLocaleDateString()}   ${isTR ? 'İmza' : 'Signature'}: ............................`,
      );

      doc.moveDown(0.5);
      doc.text(isTR ? 'Depozito Bilgileri:' : 'Deposit Information:');
      doc.text(
        isTR
          ? `Depozito Miktarı: ${financials.totalDeposit} ${financials.currency} Kesinti Miktarı: ${financials.totalDeductions} ${financials.currency} İade Miktarı: ${financials.refundAmount} ${financials.currency}`
          : `Amount of Deposit: ${financials.totalDeposit} ${financials.currency} Amount Deductions: ${financials.totalDeductions} ${financials.currency} Refund Amount: ${financials.refundAmount} ${financials.currency}`,
      );
      doc.text(isTR ? '* Detaylar için arka sayfa bakınız.' : '* See the back page for details.');
      doc.moveDown();

      // --- SECTION 3: MANAGER ---
      doc
        .font('Custom-Bold')
        .text(
          isTR ? '(3) Yurtlar ve Lojmanlar Müdürlüğü:' : '(3) Dormitories and Housing Directorate:',
        );
      doc.font('Custom-Regular');
      doc.text(
        `${isTR ? 'Yurtlar Müd. Adı Soyadı' : 'Dormitory Manager Name Surname'}: ${managerName}`,
      );
      doc.text(
        `${isTR ? 'Tarih' : 'Date'}: ............................   ${isTR ? 'İmza' : 'Signature'}: ............................`,
      );
      doc.moveDown();

      // --- SECTION 4: FINANCIAL ---
      doc
        .font('Custom-Bold')
        .text(isTR ? '(4) Mali İşler Müdürlüğü:' : '(4) Financial Affairs Directorate:');
      doc.font('Custom-Regular');
      doc.text(
        isTR
          ? '1. Depozito ve Yurt Yatırımı/Borcu: ............................'
          : '1. Deposit and Dormitory fees / Debt: ............................',
      );
      doc.text(
        isTR
          ? '2. Okul Harç Yatırımı / Borcu: ............................'
          : '2. Tuition fee / Debt: ............................',
      );
      doc.text(
        isTR
          ? '3. Geçmiş Dönemlere Ait Borçlar: ............................'
          : '3. The past Periods Debts: ............................',
      );
      doc.text(
        isTR ? '4. Diğer: ............................' : '4. Others: ............................',
      );
      doc.moveDown(0.5);
      doc.text(
        isTR
          ? 'Mali İşler Müdürü Adı Soyadı: ............................'
          : 'Manager of Financial Affairs Name Surname: ............................',
      );
      doc.text(
        `${isTR ? 'Tarih' : 'Date'}: ............................   ${isTR ? 'İmza' : 'Signature'}: ............................`,
      );
      doc.moveDown();

      // --- SECTION 5: RECTOR ---
      doc
        .font('Custom-Bold')
        .text(isTR ? '(5) Rektör Danışmanı Onayı:' : '(5) Rector Consultant Confirmation:');
      doc.font('Custom-Regular');
      doc.text(
        isTR
          ? 'Rektör Danışmanı Adı Soyadı: ............................'
          : 'Rector Consultant Name Surname: ............................',
      );
      doc.text(
        `${isTR ? 'Tarih' : 'Date'}: ............................   ${isTR ? 'İmza' : 'Signature'}: ............................`,
      );

      // --- LIABILITIES (BACK PAGE) ---
      if (liabilities.length > 0) {
        doc.addPage();
        doc
          .font('Custom-Bold')
          .fontSize(12)
          .text(isTR ? 'HASAR VE BORÇ DETAYLARI' : 'DAMAGE AND DEBT DETAILS', { align: 'center' });
        doc.moveDown();
        doc.font('Custom-Regular').fontSize(10);
        liabilities.forEach((l, idx) => {
          const itemName = isTR ? l.item_name_tr : l.item_name_en;
          const displayLine = itemName
            ? `${itemName} (${l.report_description}): ${l.amount} ${l.currency}`
            : `${l.report_description}: ${l.amount} ${l.currency}`;
          doc.text(`${idx + 1}. ${displayLine}`);
        });
      }

      doc.end();
    });
  }

  private createContractPdf(
    student: any,
    room: any,
    bed: any,
    booking: any,
    snapshots: any[],
    staff: any,
    manager: any,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const isTR = isTurkishNational(student.nationalityCode);

      let staffName = 'Dormitory Administrator';
      if (staff) {
        if (staff.firstName && staff.lastName) {
          staffName = `${staff.firstName} ${staff.lastName}`;
        } else if (staff.email) {
          staffName = staff.email;
        }
      }

      let managerName = isTR ? 'Konaklama Müdürü' : 'Housing Manager';
      if (manager) {
        if (manager.firstName && manager.lastName) {
          managerName = `${manager.firstName} ${manager.lastName}`;
        } else if (manager.email) {
          managerName = manager.email;
        }
      }

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      // Register fonts
      doc.registerFont('Custom-Regular', this.fontPath);
      doc.registerFont('Custom-Bold', this.fontBoldPath);

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- 1. HEADER ---
      doc
        .font('Custom-Bold')
        .fontSize(14)
        .text('EUROPEAN UNIVERSITY OF LEFKE', { align: 'center' });

      const subHeader = isTR
        ? 'Konaklama ve Yurt Yönetimi'
        : 'Accommodation and Housing Management';
      const title = isTR
        ? 'Kampüs Yurt Demirbaş/Stok Sözleşmesi'
        : 'Campus Dormitory Inventory/Stock Contract';

      doc.fontSize(12).text(subHeader, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).text(title, { align: 'center', underline: true });
      doc.moveDown();

      // --- 2. PREAMBLE ---
      doc.font('Custom-Regular').fontSize(10);

      const preamble = isTR
        ? `${student.firstName} ${student.lastName} (Öğrenci No: ${student.studentNumber}), ` +
          `LAÜ'de kalırken bu sözleşmeyi ${staffName} gözetiminde, ` +
          `${room.name} numaralı yurt odasını devralırken imzalamıştır. ` +
          `Yukarıda adı geçen öğrenci, yurttan ayrılırken bu sözleşmeyi ve odayı yurt yöneticisine teslim etmek zorundadır. ` +
          `Öğrenci, herhangi bir hasar veya kayıp durumunda, olayın meydana geldiği tarihteki Yurt El Kitabında listelenen ` +
          `güncel değişim bedeli üzerinden Üniversiteye geri ödeme yapmayı kabul eder.`
        : `${student.firstName} ${student.lastName} (Student ID: ${student.studentNumber}) ` +
          `who stays at EUL signed this contract with the supervision of the ${staffName}, ` +
          `while taking over the dormitory room ${room.name}. ` +
          `The above mentioned student has to hand over that contract and the room to the dormitory administrator ` +
          `while leaving the dormitory. The student agrees to reimburse the University ` +
          `based on the current replacement value listed in the Residence Handbook at the time of any damage or loss incident.`;

      doc.text(preamble, { align: 'justify' });
      doc.moveDown();

      // --- 3. INVENTORY TABLE ---
      const tableTitle = isTR ? '1. Demirbaş/Stok Listesi' : '1. Inventory/Stock List';
      doc.font('Custom-Bold').text(tableTitle, { underline: true });
      doc.moveDown(0.5);

      this.drawTable(doc, snapshots, isTR);

      doc.moveDown();

      // --- 4. EXPLANATION / NOTE ---
      doc.font('Custom-Bold').fontSize(9);
      const note = isTR
        ? 'NOT: Diğer demirbaşların, duvar ve kapı boyalarının kirlenmesi ve yıpranması durumunda ödenecektir.'
        : 'NOTE: To be paid in case the other inventory, the wall and the door paints get dirty and worn.';
      doc.text(note);
      doc.moveDown();

      // --- 5. DECLARATION ---
      const now = new Date();
      doc.font('Custom-Regular').fontSize(10);

      const declaration = isTR
        ? `${room.name} numaralı odayı (Yatak: ${bed.label}), yukarıda belirtilen hususları dikkate alarak ` +
          `${now.toLocaleString('tr-TR')} tarihinde devraldım.`
        : `I took over the Room numbered ${room.name} (Bed: ${bed.label}) on ${now.toLocaleString()} ` +
          `taking the above mentioned issues into consideration.`;

      doc.text(declaration, { align: 'justify' });
      doc.moveDown(2);

      // --- 6. SIGNATURES ---
      const ySig = doc.y;

      // Column 1: Student
      const studentLabel = isTR ? 'Teslim Alan Öğrenci' : 'Recipient Student';
      doc.text(studentLabel, 40, ySig);
      doc.text(`${student.firstName} ${student.lastName}`, 40, ySig + 15);
      doc.text(`ID: ${student.studentNumber}`, 40, ySig + 30);
      const sigLabel = isTR ? 'İmza' : 'Signature';
      doc.text(`${sigLabel}: ....................`, 40, ySig + 55);

      // Column 2: Administrator
      const adminLabel = isTR ? 'Yurt Yöneticisi' : 'Dormitory Administrator';
      doc.text(adminLabel, 200, ySig);
      doc.text(staffName, 200, ySig + 15);
      doc.text(`${sigLabel}: ....................`, 200, ySig + 55);

      // Column 3: Manager
      const managerLabel = isTR ? 'Konaklama Müdürü' : 'Housing Manager';
      doc.text(managerLabel, 380, ySig);
      doc.text(managerName, 380, ySig + 15);
      doc.text(`${sigLabel}: ....................`, 380, ySig + 55);

      // --- 7. RULES PAGE (BACK SIDE) ---
      doc.addPage({ margin: 40, size: 'A4' });
      this.drawRulesPage(doc, student, room, bed, isTR);

      doc.end();
    });
  }

  private drawRulesPage(doc: PDFKit.PDFDocument, student: any, room: any, bed: any, isTR: boolean) {
    const now = new Date().toLocaleString(isTR ? 'tr-TR' : 'en-US');
    const studentFullName = `${student.firstName} ${student.lastName}`;

    doc.font('Custom-Bold').fontSize(10);
    const rulesTitle = isTR
      ? 'LAÜ YURT KURALLARI TEBLİĞ TUTANAĞI'
      : 'Rules, regulations and general guidelines for all students of the residence halls';

    doc.text(rulesTitle, { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(isTR ? 9 : 8).font('Custom-Regular');

    const rules = isTR
      ? [
          `1. Yurt yönetimince, tahsis edilen oda, ranza, yatak dolap masa sandalye vb. den başka yer ve eşyayı işgal etmeyeceğimi ve kullanmayacağımı,`,
          '2. Yurt yönetimince belirlenen yerler dışında (LAÜ öğrencisi bile olsa) misafir kabul etmeyeceğimi,',
          '3. Odamda hiç kimseyi yatılı olarak barındırmayacağımı,',
          '4. Yurt binalarında duvarlara, kapılara, demirbaş eşya üzerine yazı yazarak, işaret ve şekiller çizerek veya resim, poster vb. asıp / çivileyip zarar vermeyeceğimi, zarar verdiğim takdirde hasarları tazmin edeceğimi,',
          '5. Yurt binalarında ve yurtlar çevresi ile kampüs içinde alkollü içecek, uyuşturucu ve uyarıcı madde bulundurmayacağımı ve kullanmayacağımı,',
          '6. Kumar olarak tanımlanan oyunları oynamayacağımı,',
          '7. İçeriği ne olursa olsun hiçbir afiş veya posteri odama ve yurtlara asmayacağımı,',
          '8. Elbise dolaplarında kokulu, akıcı ve bozulabilecek yiyecek maddeleri bulundurmayacağımı,',
          '9. Personel ve diğer şahıslarla olan ilişkilerimde kaba ve saygısız davranmayacağımı, çevremi temiz tutacağımı, gürültü etmeyeceğimi, başkalarını rahatsız edecek şekilde ve yüksek tonda müzik dinlemeyeceğimi, televizyon izlemeyeceğimi aynı şekilde herhangi bir müzik aleti çalmayacağımı ve şarkı söylemeyeceğimi,',
          '10. Görgü kurallarına uyacağımı, yurt odamı ve diğer yurt bölümlerini temiz ve düzenli tutacağımı,',
          '11. Yurtlarda evcil de olsa hayvan beslemeyeceğimi,',
          '12. Yurtlarda görevli personelin işine ve sorumluluk alanına müdahale etmeyeceğimi, onlara karşı saygılı davranacağımı,',
          '13. Yurt kimlik kartımı gerekli kontrollerde ve sorulduğunda üniversite personeline veya güvenlik görevlilerine göstereceğimi,',
          '14. Her türlü bilgisayar aracılığı ile yapılabilecek suçlardan uzak duracağımı ve kimsenin bilgisayarına izinsiz girmeye çalışmayacağımı ve zarar vermeyeceğimi,',
          '15. Gerek yarıyıl gerekse diğer uzun tatillerde ya da herhangi bir nedenle yurtların kapatılması halinde tahsis edilen yurtta ve odada kalacağımı,',
          '16. Öğrenim döneminin başlangıcından üç gün önce yurda girebileceğimi, öğrenim dönemi bitiminden en geç üç gün sonra yurttan ayrılacağımı,',
          '17. Yurtlara kayıt yapan her öğrencinin 1(bir) kez oda değiştirme hakkı olduğunu, ikinci oda değişikliğinin beş bin türk lirası (5000TL) ücrete tabii olduğunu,',
          '18. Yurtlardan uzaklaştırma cezası aldığım takdirde yurt ücreti iadesi almayacağımı,',
          '19. Yurt ücreti yıllık olup yurt iptali durumunda yıllık ücretin tahsil edileceğini,',
          '20. Yurt ücretini ödemeyi taahhüt ettiğim , taksit tarihi gelmiş ödemelerimi 7(Yedi) gün geciktirmem durumunda yurt ile ilişkimin kesileceğini ve paketimin iptal edileceğini,',
          '21. Yurtlarda yapacağım demirbaş zararının maddi bedeli tespit edildikten sonra en geç 10 (on) iş günü içerisinde ödemem gerektiğini ve ödemediğim takdirde bir disiplin suçu işlemiş olacağımı,',
          "22. Bu tutanakta belirtilen hususlara ve bunların dışında Üniversite'nin Yurtlarla ilgili aldığı/alacağı kararlara uymadığım takdirde Yurtlar Müdürlüğünce hakkımda Disiplin İşlemi yapılacağının ve bu işlem sonucu yurttan çıkarılabileceğimin bilincinde olduğumu,",
          '23. Odamın genel temizliğinden sorumlu olduğumu ve odamı düzenli temizleyeceğimi, temizlemediğim takdirde odamın yurt yönetimi tarafından temizleneceğini ve temizlik hizmeti ücretinin tarafımdan ödeneceğini veya hasar olarak hesabıma işleneceğini,',
          '24. Özellikle banyoyu kullandıktan sonra iyice havalandıracağımı ve oluşabilecek küfü engelleyeceğimi, yine duş ve banyo bataryalarını düzenli sileceğimi ve kireç oluşumuna seb vermeyeceğime, bu işlemleri yapmadığım takdirde oluşacak küften dolayı boya parasının ve oluşacak kireçten ötürü zarar görecek olan banyo ve lavabo bataryalarının ve duş kabininin bedelinin tarafımdan ödeneceğini ,',
          '25. Ortak alanlarda bulunan (TV, sandalye, masa, fırın, ocak vb.) demirbaşları ve kullanım alanlarını koruyacağımı ve korumayan arkadaşım olduğu zaman uyaracağımı, hasarın oluşması takdirde ortak alan kesintisi olarak benden de kesinti yapılacağını,',
          '26. 2025/ 2026 Akademik yılı bitiş tarihi 8 Haziran 2026 olup tüm öğrenciler gibi benim de belirtilen tarihte çıkış yapacağımı,',
          '27. Belirtilmiş olan yurt kapanış tarihinde en geç yurt çıkış işlemimi yapacağımı yurt çıkış işlemi yapmadığım takdirde yurt çıkışımın yurt yönetimince yapılacağını ve oluşan zarar ziyan kesintilerine itiraz edemeyeceğimi,',
          '28. 44/2008 Sayılı Tütün Ürünlerinin Zararlarından Korunma ve Denetim Yasası uyarınca kapalı alanlarda tütün ürünleri kullanmayacağımı, kullandığım takdirde asgari ücretin onda biri cezası olduğunu ve bu cezayı ödemekle mükellef olduğumu,',
          '29. Depozito iadeleri her akademik dönem sonunda Muhasebe müdürlüğü tarafından yapılacağını,',
          '30. Bu yurt tutanağında belirtilen kurallar dışında “Yurtlar Kurallar ve İlkeler Yönetmeliği” kurallarının uygulandığını ve http://www.eul.edu.tr/yurtlar/yurt-bilgileri/ adresinden temin edip okuyacağımı ve bu yönetmeliğe riayet edeceğimi,',
          '31. Odamda veya kişisel zimmetimde bulunan eşyalarda oluşacak olan hasar miktarı depozitomun karşılamadığı durumlarda oluşan hasarı ödeyeceğimi, ödemediğim takdirde borçlandırılacağımı,',
          '32. Yurda giriş yaptığım tarih itibari ile bana zimmetlenen oda veya kişisel zimmetlerimde var olan hasarları 24 saat içerisinde yurt yönetimine bildireceğimi, bildirmediğim takdirde her türlü sorumluluğun bana ait olduğunu ve depozitomdan kesinti yapılacağını,',
          '33. Kişisel tüm eşyalarımın ve paramın kendi sorumluluğumda bulunduğunu ve meydana gelebilecek herhangi bir kayıp vb. durumda Üniversite ve yurt idaresinin sorumlu olmadığını, kabul ve beyan ederim.',
        ]
      : [
          '1. Students of the residence halls are responsible for all items assigned to them by the residence hall staff including bed, tables, chairs etc. Items must not be moved or distributed to another rooms.',
          '2. Students of the residence halls are required to obey all the rules and regulations and keep their assigned rooms clean and tidy.',
          '3. Any acts of vandalism such as graffiti writing, destruction or damage to University property will result in financial penalties and disciplinary actions. The damage caused to property will be charged to the student at the current cost of the items.',
          '4. Writing, drawing, pasting, putting any posters or pictures (despite their content) on the walls, doors and on any resident property is prohibited. Students must cover the cost of damage to the property/inventory as a result of these actions. Whatever their content is, student will not paste/put any posters/banners into their room and residence halls.',
          '5. Students will ensure that shower rooms are thoroughly ventilated after use to avoid mildew. Shower and sink faucets should be regularly cleaned to avoid lime. Failure to carry out these processes will result in a charge for the cost of paint needed for the possible mildew, as well as the cost of the shower, sink faucets and the shower cabin damaged as a result of possible lime.',
          '6. Students will ensure that all residence halls property in the common places (TVs, chairs, tables, ovens, cookers, etc.) is used and kept properly and that fellow students are informed on how to use residence property correctly. Wrongful use of common place property will result in charges for damages to Common Area Deductions.',
          '7. Entering Residence Halls Staff Designated Areas of work and interfering in staff duties or responsibilities is forbidden. Students of residence halls are required to treat all staff in a respectful manner.',
          '8. Any misbehaviour, aggressive or rude actions towards administrative and service personnel of residence halls is forbidden. These actions also include leaving the common areas messy, causing noise by listening to music or watching television loudly, playing any musical instrument or singing songs.',
          '9. All students of the residence halls must pay the cost of the items damaged in the assigned rooms. In the event that the deposit is insufficient, additional charges will be incurred to the student.',
          '10. All students of the residence halls are obligated to inform, within 24 hours, the residence staff of any damage to the room items. Failure to report damages, all responsibility falls on the student and deductions will be made from student’s security deposit fee.',
          '11. Students of the residence halls must accept that the cost of any wear and damage caused due to general use of residence property will be deducted from the student’s security deposit fee.',
          '12. All students must make full payment for any damages caused to residence property within ten (10) working days at the cost amount of the damages. Failure to make payment will lead to disciplinary proceedings.',
          '13. Students of residence halls must accept that, in accordance with the 44/2008 Prevention and Control Act of Tobacco Products Loss, the use of tobacco products in indoor areas is prohibited. Any student of the residence halls that do not comply with this act is subject and obligated to pay a penalty of one tenth of minimum wage cost.',
          '14. The consumption and storage of alcoholic drinks and drugs on/around the campus is strictly forbidden. Residents will incur disciplinary action (expulsion) if they do not obey this rule.',
          '15. Gambling activities or keeping items related to gambling on the premises is subject to disciplinary action.',
          '16. Keeping any perishable, unsavoury or leaking products in the wardrobes is prohibited.',
          '17. Students of the residence halls will not accept guests (including EUL students) into residence rooms or into the residence hall buildings, in exception of the places approved by the residence management. Therefore, it is strictly prohibited to accommodate any guest.',
          '18. It is illegal to engage in any activity through the use of a computer to gain access to other student’s computers without permission or to cause harm.',
          '19. Keeping animals and pets in the residence halls is forbidden.',
          '20. Students are required to show their resident entry cards to the university and security personnel when asked.',
          '21. Students can check into the residence halls three days before the beginning of classes every term and must check out of the residence halls within three days after the end of the term.',
          '22. Students can request to change rooms once (1) without additional costs. However, another room change requires a hundred euro (€ 150) additional payment.',
          '23. If residence halls are closed for any reason, during term breaks or long holidays, students are expected to stay at assigned residence halls and rooms.',
          '24. Students who pay the residence hall fees in instalments must make their payments on the specified instalment dates.',
          '25. The Housing Agreement is valid for the duration of one academic year (September 2025 - June 2026). If student moves-out before the end date, the student is still liable to pay one academic year housing fee.',
          '26. Failure to make the agreed payments for the residence fees with in 7 (seven) days of the expected date will result in the termination of the residence agreement.',
          '27. Students that are dismissed from residence halls are not entitled to any refund.',
          '28. Students of the residence halls agree to comply with all matters stated in this contract and any decisions taken / to be taken by the University regarding the residence halls. The Residence Management reserves the right to take disciplinary action against students and removal of students from the residence.',
          '29. Students of the residence halls are responsible for the general cleaning of rooms. Failure to carry out frequent cleaning will result in a cleaning service charge to be paid by the student.',
          '30. All students of the residence halls hereby agree that all personal money and personal belongings are under the student’s responsibility and accept that in the unlikely case of any loss the university and residence staff and management is not responsible or liable.',
          '31. All students must check-out of the residence halls by the end date of 2025/2026 academic year, June 08, 2026.',
          '32. All students of the residence halls must complete check-out procedures before the end date of 2025/2026 academic year. Students that do not complete check out by the stated date will have their check out procedure completed by the residence halls staff and will not object to any damage or loss deductions.',
          '33. Refundable security deposit fee refund is processed by the accounting office at the end of each academic term.',
          '34. Apart from the rules stated in this residence record of trial, all students of the residence halls must accept and apply the ‘Residence Halls Rules and Regulations Principles’ and all students of the residence halls must have access, read and obtain a copy to these rules from http://www.eul.edu.tr/en/dormitories/dormitory-informations/.',
        ];

    rules.forEach((rule) => {
      doc.text(rule, { align: 'justify' });
      doc.moveDown(0.1);
    });

    doc.moveDown(0.5);
    doc.font('Custom-Bold');
    doc.text(`${isTR ? 'Öğrenci' : 'Student'}: ${studentFullName}`);
    doc.text(`${isTR ? 'No' : 'ID'}: ${student.studentNumber}`);
    doc.text(`${isTR ? 'Oda' : 'Room'}: ${room.name} (${bed.label})`);
    doc.text(`${isTR ? 'Tarih' : 'Date'}: ${now}`);
    doc.moveDown(0.5);
    doc.text(`${isTR ? 'İmza' : 'Signature'}: .................................`);
  }

  private drawTable(doc: PDFKit.PDFDocument, items: any[], isTR: boolean) {
    const startY = doc.y;
    const startX = 40;
    const colWidth = 250; // Width of one of the two main columns
    const gap = 10;

    // Sub-column offsets within each main column
    const offName = 0;
    const offScope = 160;
    const offQty = 220;

    const drawHeader = (x: number, y: number) => {
      doc.fontSize(9).font('Custom-Bold');
      doc.text(isTR ? 'Eşya Adı' : 'Item Name', x + offName, y);
      doc.text(isTR ? 'Kapsam' : 'Scope', x + offScope, y);
      doc.text(isTR ? 'Adet' : 'Qty', x + offQty, y);
      doc
        .moveTo(x, y + 12)
        .lineTo(x + colWidth, y + 12)
        .stroke();
    };

    drawHeader(startX, startY);
    drawHeader(startX + colWidth + gap, startY);

    let currentY = startY + 18;
    doc.font('Custom-Regular').fontSize(8.5);

    // Split items into two halves
    const half = Math.ceil(items.length / 2);
    const leftItems = items.slice(0, half);
    const rightItems = items.slice(half);

    const maxRows = Math.max(leftItems.length, rightItems.length);

    for (let i = 0; i < maxRows; i++) {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        drawHeader(startX, currentY);
        drawHeader(startX + colWidth + gap, currentY);
        currentY += 18;
      }

      // Zebra striping
      if (i % 2 === 0) {
        doc
          .rect(startX, currentY - 2, colWidth * 2 + gap, 12)
          .fillColor('#f5f5f5')
          .fill()
          .fillColor('black');
      }

      // Left Column
      const left = leftItems[i];
      if (left) {
        const prefix = left.scope === 'bed' ? (isTR ? 'Kişisel' : 'Pers') : isTR ? 'Oda' : 'Room';
        const itemName = isTR ? left.nameTr || left.nameEn : left.nameEn || left.nameTr;
        doc.text(itemName, startX + offName + 2, currentY, {
          width: offScope - 5,
          lineBreak: false,
        });
        doc.text(prefix, startX + offScope, currentY);
        doc.text(left.quantity.toString(), startX + offQty, currentY);
      }

      // Right Column
      const right = rightItems[i];
      if (right) {
        const xPos = startX + colWidth + gap;
        const prefix = right.scope === 'bed' ? (isTR ? 'Kişisel' : 'Pers') : isTR ? 'Oda' : 'Room';
        const itemName = isTR ? right.nameTr || right.nameEn : right.nameEn || right.nameTr;
        doc.text(itemName, xPos + offName + 2, currentY, { width: offScope - 5, lineBreak: false });
        doc.text(prefix, xPos + offScope, currentY);
        doc.text(right.quantity.toString(), xPos + offQty, currentY);
      }

      currentY += 12;
    }

    doc.x = startX;
    doc.y = currentY + 10;
  }
}
