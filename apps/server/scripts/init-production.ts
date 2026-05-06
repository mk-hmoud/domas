import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/domain/users/services/users.service';
import { LocationsService } from '../src/domain/locations/services/locations.service';
import { AccessRepository } from '../src/domain/users/repositories/access.repository';
import { DatabaseService } from '../src/core/database/database.service';
import { LocationType } from '../src/common/enums/location-type.enum';
import { AuditUserContext } from '../src/common/interfaces/audit-user-context.interface';
import { COUNTRIES } from '@domas/ts-types';
import { PERMISSIONS } from '../src/common/constants/permissions';
import { SYSTEM_ROLES } from '../src/common/constants/system-roles';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'], // Mute info logs
  });

  const usersService = app.get(UsersService);
  const locationsService = app.get(LocationsService);
  const accessRepository = app.get(AccessRepository);
  const db = app.get(DatabaseService);
  const logger = new Logger('SystemInit');

  const systemContext: AuditUserContext = {
    userId: '00000000-0000-0000-0000-000000000000',
    username: 'system_installer_script',
    ipAddress: '127.0.0.1',
    userAgent: 'Production Init Script',
  };

  try {
    // 0. Handle Countries
    const countryCheck = await db.query('SELECT COUNT(*) FROM countries');
    if (parseInt(countryCheck.rows[0].count, 10) === 0) {
      console.log('\ud83c\udf0d  Populating countries table...');

      for (const [code, name] of COUNTRIES) {
        await db.query(
          'INSERT INTO countries (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
          [code, name],
        );
      }
      console.log('\u2705 Countries populated.');
    }

    // 0.1 Handle Permissions & Roles (RBAC Seed)
    console.log('\ud83d\udee1\ufe0f  Seeding RBAC system...');

    // Seed Permissions
    const allPermissionIds: number[] = [];
    for (const slug of Object.values(PERMISSIONS)) {
      const perm = await accessRepository
        .createPermission(slug, slug)
        .catch(() => accessRepository.findPermissionBySlug(slug)); // Handle conflict
      if (perm) allPermissionIds.push(perm.id);
    }

    // Seed Roles

    const studentRole = await accessRepository
      .createRole(SYSTEM_ROLES.STUDENT, 'Student Access', true)
      .catch(() => accessRepository.findRoleByName(SYSTEM_ROLES.STUDENT));

    const adminRole = await accessRepository
      .createRole(SYSTEM_ROLES.ADMIN, 'System Administrator with full access', true)
      .catch(() => accessRepository.findRoleByName(SYSTEM_ROLES.ADMIN));

    const managerRole = await accessRepository
      .createRole(SYSTEM_ROLES.DORM_MANAGER, 'Dormitory Manager with operational access', true)
      .catch(() => accessRepository.findRoleByName(SYSTEM_ROLES.DORM_MANAGER));

    // Assign Permissions
    if (adminRole) {
      await accessRepository.assignPermissionsToRole(adminRole.id, allPermissionIds);
    }

    if (managerRole) {
      // Manager gets most permissions EXCEPT Role Creation and Booking Approvals
      const managerPermissionIds = [];
      const forbiddenSlugs: string[] = [
        PERMISSIONS.ROLES_MANAGE, // Can't create roles
        PERMISSIONS.BOOKINGS_APPROVE_FINANCIAL, // Can't approve bookings
      ];

      for (const slug of Object.values(PERMISSIONS)) {
        if (!forbiddenSlugs.includes(slug)) {
          const perm = await accessRepository.findPermissionBySlug(slug);
          if (perm) managerPermissionIds.push(perm.id);
        }
      }
      await accessRepository.assignPermissionsToRole(managerRole.id, managerPermissionIds);
    }

    console.log('\u2705 RBAC seeded.');

    // 1. Handle Admin User
    const email = 'recovery_admin@dorm.com';
    const adminUser = await usersService.findByEmail(email);

    if (!adminUser) {
      // Generates a 24-character random string (e.g. "aF92-kL4m-99xZ...")
      const password =
        crypto
          .randomBytes(12)
          .toString('hex')
          .match(/.{1,4}/g)
          ?.join('-') || 'secure-pass';

      // create recovery admin
      await usersService.createRecoveryAdmin(systemContext, {
        email,
        password: password,
      });

      // Print credentials
      const border = '════════════════════════════════════════════════════════════';
      console.log('\n');
      console.log(`\u2554${border}\u2557`);
      console.log(`\u2551                                                            \u2551`);
      console.log(
        `\u2551   \ud83d\ude80 DORM SYSTEM PRODUCTION INITIALIZED                    \u2551`,
      );
      console.log(`\u2551                                                            \u2551`);
      console.log(`\u2551   Use these credentials to log in and create your          \u2551`);
      console.log(`\u2551   personal account immediately.                            \u2551`);
      console.log(`\u2551                                                            \u2551`);
      console.log(`\u2551   \ud83d\udce7 Email:    ${email.padEnd(43)} \u2551`);
      console.log(`\u2551   \ud83d\udd11 Password: \x1b[32m${password.padEnd(43)}\x1b[0m \u2551`);
      console.log(`\u2551                                                            \u2551`);
      console.log(
        `\u2551   \u26a0\ufe0f  STORE THIS SECURELY. IT CANNOT BE RECOVERED.          \u2551`,
      );
      console.log(`\u2551                                                            \u2551`);
      console.log(`\u255a${border}\u255d`);
      console.log('\n');
    } else {
      console.log('\u2705 Admin user already exists. Skipping user creation.');
    }

    // 2. Handle Root Location
    const locations = await locationsService.findAll({ page: 1, limit: 1 });
    if (locations.total === 0) {
      console.log('\ud83c\udfdb  Creating root location: University...');
      await locationsService.create(
        {
          name: 'University',
          type: LocationType.UNIVERSITY,
        },
        systemContext,
      );
      console.log('\u2705 Root location created.');
    } else {
      console.log('\u2705 Locations already exist. Skipping root creation.');
    }

    // 3. Seed Document Templates
    console.log('\ud83d\udcc4  Seeding document templates...');
    const templateCount = await db.query('SELECT COUNT(*) FROM document_templates');
    if (parseInt(templateCount.rows[0].count, 10) === 0) {
      const templates = buildDocumentTemplates();
      for (const t of templates) {
        await db.query(
          `INSERT INTO document_templates (type, language, title, sections)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (type, language) DO NOTHING`,
          [t.type, t.language, t.title, JSON.stringify(t.sections)],
        );
      }
      console.log('\u2705 Document templates seeded (4 templates).');
    } else {
      console.log('\u2705 Document templates already exist. Skipping.');
    }
  } catch (error) {
    logger.error('Failed to initialize system', error);
  } finally {
    await app.close();
  }
}

// ---------------------------------------------------------------------------
// Document template section definitions — extracted from ContractsService
// ---------------------------------------------------------------------------

function buildDocumentTemplates() {
  const CHECK_IN_EN_SECTIONS = [
    {
      type: 'text',
      content: 'EUROPEAN UNIVERSITY OF LEFKE',
      align: 'center',
      bold: true,
      fontSize: 14,
    },
    {
      type: 'text',
      content: 'Accommodation and Housing Management',
      align: 'center',
      fontSize: 12,
    },
    { type: 'spacer', lines: 0.5 },
    {
      type: 'text',
      content: 'Campus Dormitory Inventory/Stock Contract',
      align: 'center',
      bold: true,
      fontSize: 14,
      underline: true,
    },
    { type: 'spacer' },
    {
      type: 'text',
      content:
        '{{student.fullName}} (Student ID: {{student.studentNumber}}) who stays at EUL signed this contract with the supervision of the {{staff.fullName}}, while taking over the dormitory room {{room.name}}. The above mentioned student has to hand over that contract and the room to the dormitory administrator while leaving the dormitory. The student agrees to reimburse the University based on the current replacement value listed in the Residence Handbook at the time of any damage or loss incident.',
      align: 'justify',
      fontSize: 10,
    },
    { type: 'spacer' },
    { type: 'text', content: '1. Inventory/Stock List', bold: true, underline: true },
    { type: 'spacer', lines: 0.5 },
    { type: 'inventory_table' },
    { type: 'spacer' },
    {
      type: 'text',
      content:
        'NOTE: To be paid in case the other inventory, the wall and the door paints get dirty and worn.',
      bold: true,
      fontSize: 9,
    },
    { type: 'spacer' },
    {
      type: 'text',
      content:
        'I took over the Room numbered {{room.name}} (Bed: {{bed.label}}) on {{now}} taking the above mentioned issues into consideration.',
      align: 'justify',
      fontSize: 10,
    },
    { type: 'spacer', lines: 2 },
    {
      type: 'signature_row',
      columns: [
        {
          label: 'Recipient Student',
          nameVar: 'student.fullName',
          idLine: 'ID: {{student.studentNumber}}',
        },
        { label: 'Dormitory Administrator', nameVar: 'staff.fullName' },
        { label: 'Housing Manager', nameVar: 'manager.fullName' },
      ],
    },
    { type: 'page_break' },
    {
      type: 'text',
      content: 'Rules, regulations and general guidelines for all students of the residence halls',
      align: 'center',
      bold: true,
      fontSize: 10,
    },
    { type: 'spacer', lines: 0.5 },
    {
      type: 'rules_list',
      fontSize: 8,
      items: [
        '1. Students of the residence halls are responsible for all items assigned to them by the residence hall staff including bed, tables, chairs etc. Items must not be moved or distributed to another rooms.',
        '2. Students of the residence halls are required to obey all the rules and regulations and keep their assigned rooms clean and tidy.',
        '3. Any acts of vandalism such as graffiti writing, destruction or damage to University property will result in financial penalties and disciplinary actions. The damage caused to property will be charged to the student at the current cost of the items.',
        '4. Writing, drawing, pasting, putting any posters or pictures (despite their content) on the walls, doors and on any resident property is prohibited. Students must cover the cost of damage to the property/inventory as a result of these actions. Whatever their content is, student will not paste/put any posters/banners into their room and residence halls.',
        '5. Students will ensure that shower rooms are thoroughly ventilated after use to avoid mildew. Shower and sink faucets should be regularly cleaned to avoid lime. Failure to carry out these processes will result in a charge for the cost of paint needed for the possible mildew, as well as the cost of the shower, sink faucets and the shower cabin damaged as a result of possible lime.',
        '6. Students will ensure that all residence halls property in the common places (TVs, chairs, tables, ovens, cookers, etc.) is used and kept properly and that fellow students are informed on how to use residence property correctly. Wrongful use of common place property will result in charges for damages to Common Area Deductions.',
        '7. Entering Residence Halls Staff Designated Areas of work and interfering in staff duties or responsibilities is forbidden. Students of residence halls are required to treat all staff in a respectful manner.',
        '8. Any misbehaviour, aggressive or rude actions towards administrative and service personnel of residence halls is forbidden. These actions also include leaving the common areas messy, causing noise by listening to music or watching television loudly, playing any musical instrument or singing songs.',
        '9. All students of the residence halls must pay the cost of the items damaged in the assigned rooms. In the event that the deposit is insufficient, additional charges will be incurred to the student.',
        "10. All students of the residence halls are obligated to inform, within 24 hours, the residence staff of any damage to the room items. Failure to report damages, all responsibility falls on the student and deductions will be made from student's security deposit fee.",
        "11. Students of the residence halls must accept that the cost of any wear and damage caused due to general use of residence property will be deducted from the student's security deposit fee.",
        '12. All students must make full payment for any damages caused to residence property within ten (10) working days at the cost amount of the damages. Failure to make payment will lead to disciplinary proceedings.',
        '13. Students of residence halls must accept that, in accordance with the 44/2008 Prevention and Control Act of Tobacco Products Loss, the use of tobacco products in indoor areas is prohibited. Any student of the residence halls that do not comply with this act is subject and obligated to pay a penalty of one tenth of minimum wage cost.',
        '14. The consumption and storage of alcoholic drinks and drugs on/around the campus is strictly forbidden. Residents will incur disciplinary action (expulsion) if they do not obey this rule.',
        '15. Gambling activities or keeping items related to gambling on the premises is subject to disciplinary action.',
        '16. Keeping any perishable, unsavoury or leaking products in the wardrobes is prohibited.',
        '17. Students of the residence halls will not accept guests (including EUL students) into residence rooms or into the residence hall buildings, in exception of the places approved by the residence management. Therefore, it is strictly prohibited to accommodate any guest.',
        "18. It is illegal to engage in any activity through the use of a computer to gain access to other student's computers without permission or to cause harm.",
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
        "30. All students of the residence halls hereby agree that all personal money and personal belongings are under the student's responsibility and accept that in the unlikely case of any loss the university and residence staff and management is not responsible or liable.",
        '31. All students must check-out of the residence halls by the end date of 2025/2026 academic year, June 08, 2026.',
        '32. All students of the residence halls must complete check-out procedures before the end date of 2025/2026 academic year. Students that do not complete check out by the stated date will have their check out procedure completed by the residence halls staff and will not object to any damage or loss deductions.',
        '33. Refundable security deposit fee refund is processed by the accounting office at the end of each academic term.',
        "34. Apart from the rules stated in this residence record of trial, all students of the residence halls must accept and apply the 'Residence Halls Rules and Regulations Principles' and all students of the residence halls must have access, read and obtain a copy to these rules from http://www.eul.edu.tr/en/dormitories/dormitory-informations/.",
      ],
    },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'Student: {{student.fullName}}', bold: true },
    { type: 'text', content: 'ID: {{student.studentNumber}}', bold: true },
    { type: 'text', content: 'Room: {{room.name}} ({{bed.label}})', bold: true },
    { type: 'text', content: 'Date: {{now}}', bold: true },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'Signature: .................................', bold: true },
  ];

  const CHECK_IN_TR_SECTIONS = [
    {
      type: 'text',
      content: 'EUROPEAN UNIVERSITY OF LEFKE',
      align: 'center',
      bold: true,
      fontSize: 14,
    },
    { type: 'text', content: 'Konaklama ve Yurt Yönetimi', align: 'center', fontSize: 12 },
    { type: 'spacer', lines: 0.5 },
    {
      type: 'text',
      content: 'Kampüs Yurt Demirbaş/Stok Sözleşmesi',
      align: 'center',
      bold: true,
      fontSize: 14,
      underline: true,
    },
    { type: 'spacer' },
    {
      type: 'text',
      content:
        "{{student.fullName}} (Öğrenci No: {{student.studentNumber}}), LAÜ'de kalırken bu sözleşmeyi {{staff.fullName}} gözetiminde, {{room.name}} numaralı yurt odasını devralırken imzalamıştır. Yukarıda adı geçen öğrenci, yurttan ayrılırken bu sözleşmeyi ve odayı yurt yöneticisine teslim etmek zorundadır. Öğrenci, herhangi bir hasar veya kayıp durumunda, olayın meydana geldiği tarihteki Yurt El Kitabında listelenen güncel değişim bedeli üzerinden Üniversiteye geri ödeme yapmayı kabul eder.",
      align: 'justify',
      fontSize: 10,
    },
    { type: 'spacer' },
    { type: 'text', content: '1. Demirbaş/Stok Listesi', bold: true, underline: true },
    { type: 'spacer', lines: 0.5 },
    { type: 'inventory_table' },
    { type: 'spacer' },
    {
      type: 'text',
      content:
        'NOT: Diğer demirbaşların, duvar ve kapı boyalarının kirlenmesi ve yıpranması durumunda ödenecektir.',
      bold: true,
      fontSize: 9,
    },
    { type: 'spacer' },
    {
      type: 'text',
      content:
        '{{room.name}} numaralı odayı (Yatak: {{bed.label}}), yukarıda belirtilen hususları dikkate alarak {{now}} tarihinde devraldım.',
      align: 'justify',
      fontSize: 10,
    },
    { type: 'spacer', lines: 2 },
    {
      type: 'signature_row',
      columns: [
        {
          label: 'Teslim Alan Öğrenci',
          nameVar: 'student.fullName',
          idLine: 'ID: {{student.studentNumber}}',
        },
        { label: 'Yurt Yöneticisi', nameVar: 'staff.fullName' },
        { label: 'Konaklama Müdürü', nameVar: 'manager.fullName' },
      ],
    },
    { type: 'page_break' },
    {
      type: 'text',
      content: 'LAÜ YURT KURALLARI TEBLİĞ TUTANAĞI',
      align: 'center',
      bold: true,
      fontSize: 10,
    },
    { type: 'spacer', lines: 0.5 },
    {
      type: 'rules_list',
      fontSize: 9,
      items: [
        '1. Yurt yönetimince, tahsis edilen oda, ranza, yatak dolap masa sandalye vb. den başka yer ve eşyayı işgal etmeyeceğimi ve kullanmayacağımı,',
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
        '30. Bu yurt tutanağında belirtilen kurallar dışında "Yurtlar Kurallar ve İlkeler Yönetmeliği" kurallarının uygulandığını ve http://www.eul.edu.tr/yurtlar/yurt-bilgileri/ adresinden temin edip okuyacağımı ve bu yönetmeliğe riayet edeceğimi,',
        '31. Odamda veya kişisel zimmetimde bulunan eşyalarda oluşacak olan hasar miktarı depozitomun karşılamadığı durumlarda oluşan hasarı ödeyeceğimi, ödemediğim takdirde borçlandırılacağımı,',
        '32. Yurda giriş yaptığım tarih itibari ile bana zimmetlenen oda veya kişisel zimmetlerimde var olan hasarları 24 saat içerisinde yurt yönetimine bildireceğimi, bildirmediğim takdirde her türlü sorumluluğun bana ait olduğunu ve depozitomdan kesinti yapılacağını,',
        '33. Kişisel tüm eşyalarımın ve paramın kendi sorumluluğumda bulunduğunu ve meydana gelebilecek herhangi bir kayıp vb. durumda Üniversite ve yurt idaresinin sorumlu olmadığını, kabul ve beyan ederim.',
      ],
    },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'Öğrenci: {{student.fullName}}', bold: true },
    { type: 'text', content: 'No: {{student.studentNumber}}', bold: true },
    { type: 'text', content: 'Oda: {{room.name}} ({{bed.label}})', bold: true },
    { type: 'text', content: 'Tarih: {{now}}', bold: true },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'İmza: .................................', bold: true },
  ];

  const CHECK_OUT_EN_SECTIONS = [
    {
      type: 'text',
      content: 'EUROPEAN UNIVERSITY OF LEFKE',
      align: 'center',
      bold: true,
      fontSize: 12,
    },
    {
      type: 'text',
      content: 'Accommodation and Housing Management',
      align: 'center',
      fontSize: 10,
    },
    { type: 'spacer', lines: 0.5 },
    {
      type: 'text',
      content: 'Released Dormitories and Deposit Refund Application Form',
      align: 'center',
      bold: true,
      fontSize: 12,
      underline: true,
    },
    { type: 'spacer' },
    { type: 'text', content: '(1) Will be filled by the Student.', bold: true, fontSize: 10 },
    {
      type: 'text',
      content:
        'I staying in the university Lefke Center Dormitory students {{student.studentNumber}} No. 2025-2026 / 2 academic of the year holiday / move house / I will leave the dormitory / residence for reasons other refund of my deposit / transfer to the dorm debt / registration fees would be transferred to the need for offering.',
      align: 'justify',
      fontSize: 9,
    },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'Student Name Surname: {{student.fullName}}' },
    { type: 'text', content: 'Date: {{now}}   Signature: ............................' },
    { type: 'spacer' },
    { type: 'text', content: '(2) Will be filled by Dormitory Officers.', bold: true },
    {
      type: 'text',
      content:
        '{{student.fullName}} with registration number {{student.studentNumber}}, the student named EUL Lefke Center Dormitory stayed in room number {{room.name}} / {{bed.label}} which was formed in the lack of time / damage is / are not available.',
      align: 'justify',
    },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'Dormitory Officer Name Surname: {{staff.fullName}}' },
    { type: 'text', content: 'Date: {{now}}   Signature: ............................' },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'Deposit Information:' },
    { type: 'deposit_info' },
    { type: 'text', content: '* See the back page for details.' },
    { type: 'spacer' },
    { type: 'text', content: '(3) Dormitories and Housing Directorate:', bold: true },
    { type: 'text', content: 'Dormitory Manager Name Surname: {{manager.fullName}}' },
    {
      type: 'text',
      content: 'Date: ............................   Signature: ............................',
    },
    { type: 'spacer' },
    { type: 'text', content: '(4) Financial Affairs Directorate:', bold: true },
    { type: 'text', content: '1. Deposit and Dormitory fees / Debt: ............................' },
    { type: 'text', content: '2. Tuition fee / Debt: ............................' },
    { type: 'text', content: '3. The past Periods Debts: ............................' },
    { type: 'text', content: '4. Others: ............................' },
    { type: 'spacer', lines: 0.5 },
    {
      type: 'text',
      content: 'Manager of Financial Affairs Name Surname: ............................',
    },
    {
      type: 'text',
      content: 'Date: ............................   Signature: ............................',
    },
    { type: 'spacer' },
    { type: 'text', content: '(5) Rector Consultant Confirmation:', bold: true },
    { type: 'text', content: 'Rector Consultant Name Surname: ............................' },
    {
      type: 'text',
      content: 'Date: ............................   Signature: ............................',
    },
    { type: 'liability_table' },
  ];

  const CHECK_OUT_TR_SECTIONS = [
    {
      type: 'text',
      content: 'EUROPEAN UNIVERSITY OF LEFKE',
      align: 'center',
      bold: true,
      fontSize: 12,
    },
    { type: 'text', content: 'Konaklama ve Yurt Yönetimi', align: 'center', fontSize: 10 },
    { type: 'spacer', lines: 0.5 },
    {
      type: 'text',
      content: 'Yurt Çıkış ve Depozito İadesi Müracaat Formu',
      align: 'center',
      bold: true,
      fontSize: 12,
      underline: true,
    },
    { type: 'spacer' },
    { type: 'text', content: '(1) Öğrenci Tarafından Doldurulacaktır.', bold: true, fontSize: 10 },
    {
      type: 'text',
      content:
        'Ben, Üniversitenin Lefke Merkez Yurdu nda kalan {{student.studentNumber}} no lu öğrenci 2025-2026 / 1 ders yılı tatil / eve taşınma / diğer sebepler nedeniyle yurttan ayrılacağımdan yurt depozitomun iadesini / yurt borcuna aktarılmasını / kayıt harcına aktarılması için gereğini arz ederim.',
      align: 'justify',
      fontSize: 9,
    },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'Öğrenci Adı Soyadı: {{student.fullName}}' },
    { type: 'text', content: 'Tarih: {{now}}   İmza: ............................' },
    { type: 'spacer' },
    { type: 'text', content: '(2) Yurt Sorumlusu Tarafından Doldurulacaktır.', bold: true },
    {
      type: 'text',
      content:
        '{{student.fullName}} isimli, {{student.studentNumber}} kayıt nolu öğrenci Lefke Merkez Yurdu, {{room.name}} / {{bed.label}} nolu odasında kalmış olduğu süre içerisinde oluşan eksiklik / hasar vardır / yoktur.',
      align: 'justify',
    },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'Yurt Sorumlusunun Adı Soyadı: {{staff.fullName}}' },
    { type: 'text', content: 'Tarih: {{now}}   İmza: ............................' },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'Depozito Bilgileri:' },
    { type: 'deposit_info' },
    { type: 'text', content: '* Detaylar için arka sayfa bakınız.' },
    { type: 'spacer' },
    { type: 'text', content: '(3) Yurtlar ve Lojmanlar Müdürlüğü:', bold: true },
    { type: 'text', content: 'Yurtlar Müd. Adı Soyadı: {{manager.fullName}}' },
    {
      type: 'text',
      content: 'Tarih: ............................   İmza: ............................',
    },
    { type: 'spacer' },
    { type: 'text', content: '(4) Mali İşler Müdürlüğü:', bold: true },
    { type: 'text', content: '1. Depozito ve Yurt Yatırımı/Borcu: ............................' },
    { type: 'text', content: '2. Okul Harç Yatırımı / Borcu: ............................' },
    { type: 'text', content: '3. Geçmiş Dönemlere Ait Borçlar: ............................' },
    { type: 'text', content: '4. Diğer: ............................' },
    { type: 'spacer', lines: 0.5 },
    { type: 'text', content: 'Mali İşler Müdürü Adı Soyadı: ............................' },
    {
      type: 'text',
      content: 'Tarih: ............................   İmza: ............................',
    },
    { type: 'spacer' },
    { type: 'text', content: '(5) Rektör Danışmanı Onayı:', bold: true },
    { type: 'text', content: 'Rektör Danışmanı Adı Soyadı: ............................' },
    {
      type: 'text',
      content: 'Tarih: ............................   İmza: ............................',
    },
    { type: 'liability_table' },
  ];

  return [
    {
      type: 'check_in',
      language: 'EN',
      title: 'Campus Dormitory Inventory/Stock Contract',
      sections: CHECK_IN_EN_SECTIONS,
    },
    {
      type: 'check_in',
      language: 'TR',
      title: 'Kampüs Yurt Demirbaş/Stok Sözleşmesi',
      sections: CHECK_IN_TR_SECTIONS,
    },
    {
      type: 'check_out',
      language: 'EN',
      title: 'Released Dormitories and Deposit Refund Application Form',
      sections: CHECK_OUT_EN_SECTIONS,
    },
    {
      type: 'check_out',
      language: 'TR',
      title: 'Yurt Çıkış ve Depozito İadesi Müracaat Formu',
      sections: CHECK_OUT_TR_SECTIONS,
    },
  ];
}

bootstrap();
