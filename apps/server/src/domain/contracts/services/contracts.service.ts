import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { BookingsRepository } from '../../bookings/repositories/bookings.repository';
import { StudentsRepository } from '../../students/repositories/students.repository';
import { InventoryRepository } from '../../inventory/repositories/inventory.repository';
import { BedsRepository } from '../../locations/repositories/beds.repository';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { DatabaseService } from '../../../core/database/database.service';
import { ContractsRepository } from '../repositories/contracts.repository';
import { UsersRepository } from '../../users/repositories/users.repository';
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
    private readonly usersRepository: UsersRepository,
    private readonly db: DatabaseService,
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

    // Fetch any user with 'Dorm Manager' role for the manager signature
    const managers = await this.usersRepository.findAll({ page: 1, limit: 1 }, client);
    // This is a simplified lookup. Ideally, we'd have a findByRole method.
    // For now, I will use the first user found as a placeholder or refine the query.

    // Better: Query specifically for a manager
    const managerRes = await this.db.query(`
      SELECT u.* FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Dorm Manager' AND u.is_active = TRUE
      LIMIT 1
    `);
    const manager = managerRes.rows[0];

    if (!student || !room || !bed) throw new NotFoundException('Missing booking details');

    const pdfBuffer = await this.createContractPdf(
      student,
      room,
      bed,
      booking,
      snapshots,
      staff,
      manager,
    );

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
    staff: any,
    manager: any,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const isTR = student.nationalityCode === 'TR';

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

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- 1. HEADER ---
      doc
        .font('Helvetica-Bold')
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
      doc.font('Helvetica').fontSize(10);

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
      doc.font('Helvetica-Bold').text(tableTitle, { underline: true });
      doc.moveDown(0.5);

      this.drawTable(doc, snapshots, isTR);

      doc.moveDown();

      // --- 4. EXPLANATION / NOTE ---
      doc.font('Helvetica-Bold').fontSize(9);
      const note = isTR
        ? 'NOT: Diğer demirbaşların, duvar ve kapı boyalarının kirlenmesi ve yıpranması durumunda ödenecektir.'
        : 'NOTE: To be paid in case the other inventory, the wall and the door paints get dirty and worn.';
      doc.text(note);
      doc.moveDown();

      // --- 5. DECLARATION ---
      const now = new Date();
      doc.font('Helvetica').fontSize(10);

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

    doc.font('Helvetica-Bold').fontSize(10);
    const rulesTitle = isTR
      ? 'LAÜ YURT KURALLARI TEBLİĞ TUTANAĞI'
      : 'Rules, regulations and general guidelines for all students of the residence halls';

    doc.text(rulesTitle, { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(7.5).font('Helvetica');

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
    doc.font('Helvetica-Bold');
    doc.text(`${isTR ? 'Öğrenci' : 'Student'}: ${studentFullName}`);
    doc.text(`${isTR ? 'No' : 'ID'}: ${student.studentNumber}`);
    doc.text(`${isTR ? 'Oda' : 'Room'}: ${room.name} (${bed.label})`);
    doc.text(`${isTR ? 'Tarih' : 'Date'}: ${now}`);
    doc.moveDown(0.5);
    doc.text(`${isTR ? 'İmza' : 'Signature'}: .................................`);
  }

  private drawTable(doc: PDFKit.PDFDocument, items: any[], isTR: boolean) {
    let y = doc.y;
    const startX = 40;
    const colName = 40;
    const colPrefix = 300;
    const colQty = 380;
    const colCheck = 440;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text(isTR ? 'Eşya Adı' : 'Item Name', colName, y);
    doc.text(isTR ? 'Kapsam' : 'Scope', colPrefix, y);
    doc.text(isTR ? 'Adet' : 'Qty', colQty, y);
    doc.text(isTR ? 'Kontrol' : 'Check', colCheck, y);

    y += 15;
    doc.moveTo(startX, y).lineTo(550, y).stroke();
    y += 5;

    doc.font('Helvetica');
    items.forEach((item, i) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const prefix = item.scope === 'bed' ? (isTR ? 'Kişisel' : 'Pers') : isTR ? 'Oda' : 'Room';
      const itemName = isTR ? item.nameTr || item.nameEn : item.nameEn || item.nameTr;

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
