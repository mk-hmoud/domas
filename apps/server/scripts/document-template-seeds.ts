import {
  DOCUMENT_LANGUAGES,
  DOCUMENT_TYPES,
  DocumentLanguage,
  DocumentType,
} from '../src/domain/document-templates/constants/document-types';

export interface DocumentTemplateSeed {
  documentType: DocumentType;
  language: DocumentLanguage;
  name: string;
  htmlBody: string;
  css: string;
}

// HTML/CSS ports of the legacy hand-coded PDFKit documents (see
// ContractsService.createContractPdf/createCheckOutPdf and
// DormCertificatesService.generateDormCertPdf), so a fresh production
// install has editable v1 published templates instead of starting on the
// uneditable built-in fallback. Each language is its own standalone
// template row (no {{#if isTR}} branching) - text reproduced verbatim from
// those generators' TR/EN branches. CSS only governs layout, so it's shared
// across both language variants of a given document type.

const CHECK_IN_HTML_EN = `
<div class="doc-header">
  <p class="org-name">EUROPEAN UNIVERSITY OF LEFKE</p>
  <p class="org-sub">Accommodation and Housing Management</p>
</div>
<h1 class="doc-title">Campus Dormitory Inventory/Stock Contract</h1>

<p class="justify">
{{student.firstName}} {{student.lastName}} (Student ID: {{student.studentNumber}}) who stays at EUL signed this contract with the supervision of the {{staffName}}, while taking over the dormitory room {{room.name}}. The above mentioned student has to hand over that contract and the room to the dormitory administrator while leaving the dormitory. The student agrees to reimburse the University based on the current replacement value listed in the Residence Handbook at the time of any damage or loss incident.
</p>

<h2 class="section-title">1. Inventory/Stock List</h2>

<table class="inventory-table">
  <thead>
    <tr>
      <th>Item Name</th>
      <th>Scope</th>
      <th>Qty</th>
    </tr>
  </thead>
  <tbody>
    {{#each items}}
    <tr>
      <td>{{#if nameEn}}{{nameEn}}{{else}}{{nameTr}}{{/if}}</td>
      <td>{{#if (eq scope "bed")}}Personal{{else}}Room{{/if}}</td>
      <td>{{quantity}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<p class="note">NOTE: To be paid in case the other inventory, the wall and the door paints get dirty and worn.</p>

<p class="justify">
I took over the Room numbered {{room.name}} (Bed: {{bed.label}}) on {{issueDate}} taking the above mentioned issues into consideration.
</p>

<div class="signature-row">
  <div class="signature-col">
    <p class="sig-label">Recipient Student</p>
    <p>{{student.firstName}} {{student.lastName}}</p>
    <p>ID: {{student.studentNumber}}</p>
    <p class="sig-line">Signature: ....................</p>
  </div>
  <div class="signature-col">
    <p class="sig-label">Dormitory Administrator</p>
    <p>{{staffName}}</p>
    <p class="sig-line">Signature: ....................</p>
  </div>
  <div class="signature-col">
    <p class="sig-label">Housing Manager</p>
    <p>{{managerName}}</p>
    <p class="sig-line">Signature: ....................</p>
  </div>
</div>

<div class="page-break"></div>

<h1 class="rules-title">Rules, regulations and general guidelines for all students of the residence halls</h1>

<p class="rule">1. Students of the residence halls are responsible for all items assigned to them by the residence hall staff including bed, tables, chairs etc. Items must not be moved or distributed to another rooms.</p>
<p class="rule">2. Students of the residence halls are required to obey all the rules and regulations and keep their assigned rooms clean and tidy.</p>
<p class="rule">3. Any acts of vandalism such as graffiti writing, destruction or damage to University property will result in financial penalties and disciplinary actions. The damage caused to property will be charged to the student at the current cost of the items.</p>
<p class="rule">4. Writing, drawing, pasting, putting any posters or pictures (despite their content) on the walls, doors and on any resident property is prohibited. Students must cover the cost of damage to the property/inventory as a result of these actions. Whatever their content is, student will not paste/put any posters/banners into their room and residence halls.</p>
<p class="rule">5. Students will ensure that shower rooms are thoroughly ventilated after use to avoid mildew. Shower and sink faucets should be regularly cleaned to avoid lime. Failure to carry out these processes will result in a charge for the cost of paint needed for the possible mildew, as well as the cost of the shower, sink faucets and the shower cabin damaged as a result of possible lime.</p>
<p class="rule">6. Students will ensure that all residence halls property in the common places (TVs, chairs, tables, ovens, cookers, etc.) is used and kept properly and that fellow students are informed on how to use residence property correctly. Wrongful use of common place property will result in charges for damages to Common Area Deductions.</p>
<p class="rule">7. Entering Residence Halls Staff Designated Areas of work and interfering in staff duties or responsibilities is forbidden. Students of residence halls are required to treat all staff in a respectful manner.</p>
<p class="rule">8. Any misbehaviour, aggressive or rude actions towards administrative and service personnel of residence halls is forbidden. These actions also include leaving the common areas messy, causing noise by listening to music or watching television loudly, playing any musical instrument or singing songs.</p>
<p class="rule">9. All students of the residence halls must pay the cost of the items damaged in the assigned rooms. In the event that the deposit is insufficient, additional charges will be incurred to the student.</p>
<p class="rule">10. All students of the residence halls are obligated to inform, within 24 hours, the residence staff of any damage to the room items. Failure to report damages, all responsibility falls on the student and deductions will be made from student's security deposit fee.</p>
<p class="rule">11. Students of the residence halls must accept that the cost of any wear and damage caused due to general use of residence property will be deducted from the student's security deposit fee.</p>
<p class="rule">12. All students must make full payment for any damages caused to residence property within ten (10) working days at the cost amount of the damages. Failure to make payment will lead to disciplinary proceedings.</p>
<p class="rule">13. Students of residence halls must accept that, in accordance with the 44/2008 Prevention and Control Act of Tobacco Products Loss, the use of tobacco products in indoor areas is prohibited. Any student of the residence halls that do not comply with this act is subject and obligated to pay a penalty of one tenth of minimum wage cost.</p>
<p class="rule">14. The consumption and storage of alcoholic drinks and drugs on/around the campus is strictly forbidden. Residents will incur disciplinary action (expulsion) if they do not obey this rule.</p>
<p class="rule">15. Gambling activities or keeping items related to gambling on the premises is subject to disciplinary action.</p>
<p class="rule">16. Keeping any perishable, unsavoury or leaking products in the wardrobes is prohibited.</p>
<p class="rule">17. Students of the residence halls will not accept guests (including EUL students) into residence rooms or into the residence hall buildings, in exception of the places approved by the residence management. Therefore, it is strictly prohibited to accommodate any guest.</p>
<p class="rule">18. It is illegal to engage in any activity through the use of a computer to gain access to other student's computers without permission or to cause harm.</p>
<p class="rule">19. Keeping animals and pets in the residence halls is forbidden.</p>
<p class="rule">20. Students are required to show their resident entry cards to the university and security personnel when asked.</p>
<p class="rule">21. Students can check into the residence halls three days before the beginning of classes every term and must check out of the residence halls within three days after the end of the term.</p>
<p class="rule">22. Students can request to change rooms once (1) without additional costs. However, another room change requires a hundred euro (€ 150) additional payment.</p>
<p class="rule">23. If residence halls are closed for any reason, during term breaks or long holidays, students are expected to stay at assigned residence halls and rooms.</p>
<p class="rule">24. Students who pay the residence hall fees in instalments must make their payments on the specified instalment dates.</p>
<p class="rule">25. The Housing Agreement is valid for the duration of one academic year (September 2025 - June 2026). If student moves-out before the end date, the student is still liable to pay one academic year housing fee.</p>
<p class="rule">26. Failure to make the agreed payments for the residence fees with in 7 (seven) days of the expected date will result in the termination of the residence agreement.</p>
<p class="rule">27. Students that are dismissed from residence halls are not entitled to any refund.</p>
<p class="rule">28. Students of the residence halls agree to comply with all matters stated in this contract and any decisions taken / to be taken by the University regarding the residence halls. The Residence Management reserves the right to take disciplinary action against students and removal of students from the residence.</p>
<p class="rule">29. Students of the residence halls are responsible for the general cleaning of rooms. Failure to carry out frequent cleaning will result in a cleaning service charge to be paid by the student.</p>
<p class="rule">30. All students of the residence halls hereby agree that all personal money and personal belongings are under the student's responsibility and accept that in the unlikely case of any loss the university and residence staff and management is not responsible or liable.</p>
<p class="rule">31. All students must check-out of the residence halls by the end date of 2025/2026 academic year, June 08, 2026.</p>
<p class="rule">32. All students of the residence halls must complete check-out procedures before the end date of 2025/2026 academic year. Students that do not complete check out by the stated date will have their check out procedure completed by the residence halls staff and will not object to any damage or loss deductions.</p>
<p class="rule">33. Refundable security deposit fee refund is processed by the accounting office at the end of each academic term.</p>
<p class="rule">34. Apart from the rules stated in this residence record of trial, all students of the residence halls must accept and apply the 'Residence Halls Rules and Regulations Principles' and all students of the residence halls must have access, read and obtain a copy to these rules from http://www.eul.edu.tr/en/dormitories/dormitory-informations/.</p>

<div class="rules-footer">
  <p>Student: {{student.firstName}} {{student.lastName}}</p>
  <p>ID: {{student.studentNumber}}</p>
  <p>Room: {{room.name}} ({{bed.label}})</p>
  <p>Date: {{issueDate}}</p>
  <p>Signature: .................................</p>
</div>
`;

const CHECK_IN_HTML_TR = `
<div class="doc-header">
  <p class="org-name">EUROPEAN UNIVERSITY OF LEFKE</p>
  <p class="org-sub">Konaklama ve Yurt Yönetimi</p>
</div>
<h1 class="doc-title">Kampüs Yurt Demirbaş/Stok Sözleşmesi</h1>

<p class="justify">
{{student.firstName}} {{student.lastName}} (Öğrenci No: {{student.studentNumber}}), LAÜ'de kalırken bu sözleşmeyi {{staffName}} gözetiminde, {{room.name}} numaralı yurt odasını devralırken imzalamıştır. Yukarıda adı geçen öğrenci, yurttan ayrılırken bu sözleşmeyi ve odayı yurt yöneticisine teslim etmek zorundadır. Öğrenci, herhangi bir hasar veya kayıp durumunda, olayın meydana geldiği tarihteki Yurt El Kitabında listelenen güncel değişim bedeli üzerinden Üniversiteye geri ödeme yapmayı kabul eder.
</p>

<h2 class="section-title">1. Demirbaş/Stok Listesi</h2>

<table class="inventory-table">
  <thead>
    <tr>
      <th>Eşya Adı</th>
      <th>Kapsam</th>
      <th>Adet</th>
    </tr>
  </thead>
  <tbody>
    {{#each items}}
    <tr>
      <td>{{#if nameTr}}{{nameTr}}{{else}}{{nameEn}}{{/if}}</td>
      <td>{{#if (eq scope "bed")}}Kişisel{{else}}Oda{{/if}}</td>
      <td>{{quantity}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<p class="note">NOT: Diğer demirbaşların, duvar ve kapı boyalarının kirlenmesi ve yıpranması durumunda ödenecektir.</p>

<p class="justify">
{{room.name}} numaralı odayı (Yatak: {{bed.label}}), yukarıda belirtilen hususları dikkate alarak {{issueDate}} tarihinde devraldım.
</p>

<div class="signature-row">
  <div class="signature-col">
    <p class="sig-label">Teslim Alan Öğrenci</p>
    <p>{{student.firstName}} {{student.lastName}}</p>
    <p>ID: {{student.studentNumber}}</p>
    <p class="sig-line">İmza: ....................</p>
  </div>
  <div class="signature-col">
    <p class="sig-label">Yurt Yöneticisi</p>
    <p>{{staffName}}</p>
    <p class="sig-line">İmza: ....................</p>
  </div>
  <div class="signature-col">
    <p class="sig-label">Konaklama Müdürü</p>
    <p>{{managerName}}</p>
    <p class="sig-line">İmza: ....................</p>
  </div>
</div>

<div class="page-break"></div>

<h1 class="rules-title">LAÜ YURT KURALLARI TEBLİĞ TUTANAĞI</h1>

<p class="rule">1. Yurt yönetimince, tahsis edilen oda, ranza, yatak dolap masa sandalye vb. den başka yer ve eşyayı işgal etmeyeceğimi ve kullanmayacağımı,</p>
<p class="rule">2. Yurt yönetimince belirlenen yerler dışında (LAÜ öğrencisi bile olsa) misafir kabul etmeyeceğimi,</p>
<p class="rule">3. Odamda hiç kimseyi yatılı olarak barındırmayacağımı,</p>
<p class="rule">4. Yurt binalarında duvarlara, kapılara, demirbaş eşya üzerine yazı yazarak, işaret ve şekiller çizerek veya resim, poster vb. asıp / çivileyip zarar vermeyeceğimi, zarar verdiğim takdirde hasarları tazmin edeceğimi,</p>
<p class="rule">5. Yurt binalarında ve yurtlar çevresi ile kampüs içinde alkollü içecek, uyuşturucu ve uyarıcı madde bulundurmayacağımı ve kullanmayacağımı,</p>
<p class="rule">6. Kumar olarak tanımlanan oyunları oynamayacağımı,</p>
<p class="rule">7. İçeriği ne olursa olsun hiçbir afiş veya posteri odama ve yurtlara asmayacağımı,</p>
<p class="rule">8. Elbise dolaplarında kokulu, akıcı ve bozulabilecek yiyecek maddeleri bulundurmayacağımı,</p>
<p class="rule">9. Personel ve diğer şahıslarla olan ilişkilerimde kaba ve saygısız davranmayacağımı, çevremi temiz tutacağımı, gürültü etmeyeceğimi, başkalarını rahatsız edecek şekilde ve yüksek tonda müzik dinlemeyeceğimi, televizyon izlemeyeceğimi aynı şekilde herhangi bir müzik aleti çalmayacağımı ve şarkı söylemeyeceğimi,</p>
<p class="rule">10. Görgü kurallarına uyacağımı, yurt odamı ve diğer yurt bölümlerini temiz ve düzenli tutacağımı,</p>
<p class="rule">11. Yurtlarda evcil de olsa hayvan beslemeyeceğimi,</p>
<p class="rule">12. Yurtlarda görevli personelin işine ve sorumluluk alanına müdahale etmeyeceğimi, onlara karşı saygılı davranacağımı,</p>
<p class="rule">13. Yurt kimlik kartımı gerekli kontrollerde ve sorulduğunda üniversite personeline veya güvenlik görevlilerine göstereceğimi,</p>
<p class="rule">14. Her türlü bilgisayar aracılığı ile yapılabilecek suçlardan uzak duracağımı ve kimsenin bilgisayarına izinsiz girmeye çalışmayacağımı ve zarar vermeyeceğimi,</p>
<p class="rule">15. Gerek yarıyıl gerekse diğer uzun tatillerde ya da herhangi bir nedenle yurtların kapatılması halinde tahsis edilen yurtta ve odada kalacağımı,</p>
<p class="rule">16. Öğrenim döneminin başlangıcından üç gün önce yurda girebileceğimi, öğrenim dönemi bitiminden en geç üç gün sonra yurttan ayrılacağımı,</p>
<p class="rule">17. Yurtlara kayıt yapan her öğrencinin 1(bir) kez oda değiştirme hakkı olduğunu, ikinci oda değişikliğinin beş bin türk lirası (5000TL) ücrete tabii olduğunu,</p>
<p class="rule">18. Yurtlardan uzaklaştırma cezası aldığım takdirde yurt ücreti iadesi almayacağımı,</p>
<p class="rule">19. Yurt ücreti yıllık olup yurt iptali durumunda yıllık ücretin tahsil edileceğini,</p>
<p class="rule">20. Yurt ücretini ödemeyi taahhüt ettiğim , taksit tarihi gelmiş ödemelerimi 7(Yedi) gün geciktirmem durumunda yurt ile ilişkimin kesileceğini ve paketimin iptal edileceğini,</p>
<p class="rule">21. Yurtlarda yapacağım demirbaş zararının maddi bedeli tespit edildikten sonra en geç 10 (on) iş günü içerisinde ödemem gerektiğini ve ödemediğim takdirde bir disiplin suçu işlemiş olacağımı,</p>
<p class="rule">22. Bu tutanakta belirtilen hususlara ve bunların dışında Üniversite'nin Yurtlarla ilgili aldığı/alacağı kararlara uymadığım takdirde Yurtlar Müdürlüğünce hakkımda Disiplin İşlemi yapılacağının ve bu işlem sonucu yurttan çıkarılabileceğimin bilincinde olduğumu,</p>
<p class="rule">23. Odamın genel temizliğinden sorumlu olduğumu ve odamı düzenli temizleyeceğimi, temizlemediğim takdirde odamın yurt yönetimi tarafından temizleneceğini ve temizlik hizmeti ücretinin tarafımdan ödeneceğini veya hasar olarak hesabıma işleneceğini,</p>
<p class="rule">24. Özellikle banyoyu kullandıktan sonra iyice havalandıracağımı ve oluşabilecek küfü engelleyeceğimi, yine duş ve banyo bataryalarını düzenli sileceğimi ve kireç oluşumuna seb vermeyeceğime, bu işlemleri yapmadığım takdirde oluşacak küften dolayı boya parasının ve oluşacak kireçten ötürü zarar görecek olan banyo ve lavabo bataryalarının ve duş kabininin bedelinin tarafımdan ödeneceğini ,</p>
<p class="rule">25. Ortak alanlarda bulunan (TV, sandalye, masa, fırın, ocak vb.) demirbaşları ve kullanım alanlarını koruyacağımı ve korumayan arkadaşım olduğu zaman uyaracağımı, hasarın oluşması takdirde ortak alan kesintisi olarak benden de kesinti yapılacağını,</p>
<p class="rule">26. 2025/ 2026 Akademik yılı bitiş tarihi 8 Haziran 2026 olup tüm öğrenciler gibi benim de belirtilen tarihte çıkış yapacağımı,</p>
<p class="rule">27. Belirtilmiş olan yurt kapanış tarihinde en geç yurt çıkış işlemimi yapacağımı yurt çıkış işlemi yapmadığım takdirde yurt çıkışımın yurt yönetimince yapılacağını ve oluşan zarar ziyan kesintilerine itiraz edemeyeceğimi,</p>
<p class="rule">28. 44/2008 Sayılı Tütün Ürünlerinin Zararlarından Korunma ve Denetim Yasası uyarınca kapalı alanlarda tütün ürünleri kullanmayacağımı, kullandığım takdirde asgari ücretin onda biri cezası olduğunu ve bu cezayı ödemekle mükellef olduğumu,</p>
<p class="rule">29. Depozito iadeleri her akademik dönem sonunda Muhasebe müdürlüğü tarafından yapılacağını,</p>
<p class="rule">30. Bu yurt tutanağında belirtilen kurallar dışında "Yurtlar Kurallar ve İlkeler Yönetmeliği" kurallarının uygulandığını ve http://www.eul.edu.tr/yurtlar/yurt-bilgileri/ adresinden temin edip okuyacağımı ve bu yönetmeliğe riayet edeceğimi,</p>
<p class="rule">31. Odamda veya kişisel zimmetimde bulunan eşyalarda oluşacak olan hasar miktarı depozitomun karşılamadığı durumlarda oluşan hasarı ödeyeceğimi, ödemediğim takdirde borçlandırılacağımı,</p>
<p class="rule">32. Yurda giriş yaptığım tarih itibari ile bana zimmetlenen oda veya kişisel zimmetlerimde var olan hasarları 24 saat içerisinde yurt yönetimine bildireceğimi, bildirmediğim takdirde her türlü sorumluluğun bana ait olduğunu ve depozitomdan kesinti yapılacağını,</p>
<p class="rule">33. Kişisel tüm eşyalarımın ve paramın kendi sorumluluğumda bulunduğunu ve meydana gelebilecek herhangi bir kayıp vb. durumda Üniversite ve yurt idaresinin sorumlu olmadığını, kabul ve beyan ederim.</p>

<div class="rules-footer">
  <p>Öğrenci: {{student.firstName}} {{student.lastName}}</p>
  <p>No: {{student.studentNumber}}</p>
  <p>Oda: {{room.name}} ({{bed.label}})</p>
  <p>Tarih: {{issueDate}}</p>
  <p>İmza: .................................</p>
</div>
`;

const CHECK_IN_CSS = `
.doc-header { text-align: center; margin-bottom: 4px; }
.org-name { font-weight: bold; font-size: 13pt; margin: 0; }
.org-sub { font-size: 10pt; margin: 2px 0 0; }
.doc-title { text-align: center; text-decoration: underline; font-size: 13pt; margin: 14px 0; }
.section-title { font-weight: bold; text-decoration: underline; font-size: 10pt; margin: 14px 0 6px; }
p.justify { text-align: justify; margin: 6px 0; }
p.note { font-weight: bold; font-size: 9pt; margin: 10px 0; }
.inventory-table th, .inventory-table td { border: 1px solid #999; padding: 4px 6px; font-size: 9pt; text-align: left; }
.inventory-table th { background: #eee; }
.inventory-table tbody tr:nth-child(even) { background: #f5f5f5; }
.signature-row { display: flex; justify-content: space-between; margin-top: 28px; }
.signature-col { width: 30%; font-size: 9pt; }
.sig-label { font-weight: bold; margin-bottom: 14px; }
.sig-line { margin-top: 30px; }
.page-break { page-break-before: always; }
.rules-title { text-align: center; text-decoration: underline; font-size: 12pt; margin: 6px 0 4px; }
p.rule { text-align: justify; font-size: 7.5pt; line-height: 1.15; margin: 1px 0; }
.rules-footer { margin-top: 6px; font-weight: bold; font-size: 9pt; page-break-inside: avoid; }
.rules-footer p { margin: 1px 0; }
`;

const CHECK_OUT_HTML_EN = `
<div class="doc-header">
  <p class="org-name">EUROPEAN UNIVERSITY OF LEFKE</p>
  <p class="org-sub">Accommodation and Housing Management</p>
</div>
<h1 class="doc-title">Released Dormitories and Deposit Refund Application Form</h1>

<h2 class="section-title">(1) Will be filled by the Student.</h2>
<p class="justify">
I staying in the university Lefke Center Dormitory students {{student.studentNumber}} No. 2025-2026 / 2 academic of the year holiday / move house / I will leave the dormitory / residence for reasons other refund of my deposit / transfer to the dorm debt / registration fees would be transferred to the need for offering.
</p>
<p>Student Name Surname: {{student.firstName}} {{student.lastName}}</p>
<p>Date: {{issueDate}}   Signature: ............................</p>

<h2 class="section-title">(2) Will be filled by Dormitory Officers.</h2>
<p class="justify">
{{student.firstName}} {{student.lastName}} with registration number {{student.studentNumber}}, the student named EUL Lefke Center Dormitory stayed in room number {{room.name}} / {{bed.label}} which was formed in the lack of time / damage is / are not available.
</p>
<p>Dormitory Officer Name Surname: {{staffName}}</p>
<p>Date: {{issueDate}}   Signature: ............................</p>

<p class="deposit-title">Deposit Information:</p>
<p>
Amount of Deposit: {{totalDeposit}} {{currency}} Amount Deductions: {{totalDeductions}} {{currency}} Refund Amount: {{refundAmount}} {{currency}}
</p>
<p>* See the back page for details.</p>

<h2 class="section-title">(3) Dormitories and Housing Directorate:</h2>
<p>Dormitory Manager Name Surname: {{managerName}}</p>
<p>Date: ............................   Signature: ............................</p>

<h2 class="section-title">(4) Financial Affairs Directorate:</h2>
<p>1. Deposit and Dormitory fees / Debt: ............................</p>
<p>2. Tuition fee / Debt: ............................</p>
<p>3. The past Periods Debts: ............................</p>
<p>4. Others: ............................</p>
<p>Manager of Financial Affairs Name Surname: ............................</p>
<p>Date: ............................   Signature: ............................</p>

<h2 class="section-title">(5) Rector Consultant Confirmation:</h2>
<p>Rector Consultant Name Surname: ............................</p>
<p>Date: ............................   Signature: ............................</p>

{{#if liabilities.length}}
<div class="page-break"></div>
<h1 class="doc-title">DAMAGE AND DEBT DETAILS</h1>
<ol class="liabilities-list">
  {{#each liabilities}}
  <li>{{description}}: {{amount}} {{currency}}</li>
  {{/each}}
</ol>
{{/if}}
`;

const CHECK_OUT_HTML_TR = `
<div class="doc-header">
  <p class="org-name">EUROPEAN UNIVERSITY OF LEFKE</p>
  <p class="org-sub">Konaklama ve Yurt Yönetimi</p>
</div>
<h1 class="doc-title">Yurt Çıkış ve Depozito İadesi Müracaat Formu</h1>

<h2 class="section-title">(1) Öğrenci Tarafından Doldurulacaktır.</h2>
<p class="justify">
Ben, Üniversitenin Lefke Merkez Yurdu nda kalan {{student.studentNumber}} no lu öğrenci 2025-2026 / 1 ders yılı tatil / eve taşınma / diğer sebepler nedeniyle yurttan ayrılacağımdan yurt depozitomun iadesini / yurt borcuna aktarılmasını / kayıt harcına aktarılması için gereğini arz ederim.
</p>
<p>Öğrenci Adı Soyadı: {{student.firstName}} {{student.lastName}}</p>
<p>Tarih: {{issueDate}}   İmza: ............................</p>

<h2 class="section-title">(2) Yurt Sorumlusu Tarafından Doldurulacaktır.</h2>
<p class="justify">
{{student.firstName}} {{student.lastName}} isimli, {{student.studentNumber}} kayıt nolu öğrenci Lefke Merkez Yurdu, {{room.name}} / {{bed.label}} nolu odasında kalmış olduğu süre içerisinde oluşan eksiklik / hasar vardır / yoktur.
</p>
<p>Yurt Sorumlusunun Adı Soyadı: {{staffName}}</p>
<p>Tarih: {{issueDate}}   İmza: ............................</p>

<p class="deposit-title">Depozito Bilgileri:</p>
<p>
Depozito Miktarı: {{totalDeposit}} {{currency}} Kesinti Miktarı: {{totalDeductions}} {{currency}} İade Miktarı: {{refundAmount}} {{currency}}
</p>
<p>* Detaylar için arka sayfa bakınız.</p>

<h2 class="section-title">(3) Yurtlar ve Lojmanlar Müdürlüğü:</h2>
<p>Yurtlar Müd. Adı Soyadı: {{managerName}}</p>
<p>Tarih: ............................   İmza: ............................</p>

<h2 class="section-title">(4) Mali İşler Müdürlüğü:</h2>
<p>1. Depozito ve Yurt Yatırımı/Borcu: ............................</p>
<p>2. Okul Harç Yatırımı / Borcu: ............................</p>
<p>3. Geçmiş Dönemlere Ait Borçlar: ............................</p>
<p>4. Diğer: ............................</p>
<p>Mali İşler Müdürü Adı Soyadı: ............................</p>
<p>Tarih: ............................   İmza: ............................</p>

<h2 class="section-title">(5) Rektör Danışmanı Onayı:</h2>
<p>Rektör Danışmanı Adı Soyadı: ............................</p>
<p>Tarih: ............................   İmza: ............................</p>

{{#if liabilities.length}}
<div class="page-break"></div>
<h1 class="doc-title">HASAR VE BORÇ DETAYLARI</h1>
<ol class="liabilities-list">
  {{#each liabilities}}
  <li>{{description}}: {{amount}} {{currency}}</li>
  {{/each}}
</ol>
{{/if}}
`;

const CHECK_OUT_CSS = `
.doc-header { text-align: center; margin-bottom: 4px; }
.org-name { font-weight: bold; font-size: 12pt; margin: 0; }
.org-sub { font-size: 10pt; margin: 2px 0 6px; }
.doc-title { text-align: center; text-decoration: underline; font-size: 12pt; margin: 10px 0 14px; }
.section-title { font-weight: bold; font-size: 10pt; margin: 14px 0 4px; }
p { font-size: 9pt; margin: 4px 0; }
p.justify { text-align: justify; }
p.deposit-title { margin-top: 10px; }
.page-break { page-break-before: always; }
.liabilities-list { font-size: 9pt; }
.liabilities-list li { margin: 3px 0; }
`;

const DORM_CERTIFICATE_HTML_EN = `
<div class="doc-header">
  <p class="org-name">EUROPEAN UNIVERSITY OF LEFKE</p>
  <p class="org-sub">Accommodation and Housing Management</p>
</div>
<h1 class="doc-title">DORMITORY ACCOMMODATION CERTIFICATE</h1>

<p class="body-text">
This is to certify that {{student.firstName}} {{student.lastName}}, student number {{student.studentNumber}}, is currently residing at the EUL Lefke Center Dormitory, {{#if bed}}Room {{room.name}}, Bed {{bed.label}},{{else}}in the university dormitory{{/if}} as of {{issueDate}}.
</p>

{{#if booking}}
<p>Accommodation Period: {{booking.startDate}} – {{booking.endDate}}</p>
{{/if}}

<p>Date of Issue: {{issueDate}}</p>

<div class="signature-block">
  <p class="sig-label">Dormitory Manager</p>
  <p>{{managerName}}</p>
  <p class="sig-line">Signature: ..................................</p>
</div>
`;

const DORM_CERTIFICATE_HTML_TR = `
<div class="doc-header">
  <p class="org-name">EUROPEAN UNIVERSITY OF LEFKE</p>
  <p class="org-sub">Konaklama ve Yurt Yönetimi</p>
</div>
<h1 class="doc-title">YURT KONAKLAMA BELGESİ</h1>

<p class="body-text">
Bu belge, {{student.firstName}} {{student.lastName}} isimli, {{student.studentNumber}} kayıt numaralı öğrencinin, Lefke Merkez Yurdu'nda {{#if bed}}{{room.name}} numaralı odada, {{bed.label}} numaralı yatakta{{else}}Üniversite yurdunda{{/if}} ikamet ettiğini tasdik etmek amacıyla düzenlenmiştir.
</p>

{{#if booking}}
<p>Konaklama Dönemi: {{booking.startDate}} – {{booking.endDate}}</p>
{{/if}}

<p>Düzenleme Tarihi: {{issueDate}}</p>

<div class="signature-block">
  <p class="sig-label">Yurtlar Müdürü</p>
  <p>{{managerName}}</p>
  <p class="sig-line">İmza: ..................................</p>
</div>
`;

const DORM_CERTIFICATE_CSS = `
.doc-header { text-align: center; margin-bottom: 4px; }
.org-name { font-weight: bold; font-size: 13pt; margin: 0; }
.org-sub { font-size: 10pt; margin: 2px 0 0; }
.doc-title { text-align: center; text-decoration: underline; font-size: 14pt; margin: 20px 0 24px; }
.body-text { text-align: justify; font-size: 11pt; line-height: 1.5; }
p { font-size: 11pt; margin: 8px 0; }
.signature-block { margin-top: 48px; font-size: 10pt; }
.sig-label { font-weight: bold; margin-bottom: 14px; }
.sig-line { margin-top: 24px; }
`;

export const DOCUMENT_TEMPLATE_SEEDS: DocumentTemplateSeed[] = [
  {
    documentType: DOCUMENT_TYPES.CHECK_IN_CONTRACT,
    language: DOCUMENT_LANGUAGES.ENGLISH,
    name: 'v1 - System Default',
    htmlBody: CHECK_IN_HTML_EN.trim(),
    css: CHECK_IN_CSS.trim(),
  },
  {
    documentType: DOCUMENT_TYPES.CHECK_IN_CONTRACT,
    language: DOCUMENT_LANGUAGES.TURKISH,
    name: 'v1 - System Default',
    htmlBody: CHECK_IN_HTML_TR.trim(),
    css: CHECK_IN_CSS.trim(),
  },
  {
    documentType: DOCUMENT_TYPES.CHECK_OUT_CONTRACT,
    language: DOCUMENT_LANGUAGES.ENGLISH,
    name: 'v1 - System Default',
    htmlBody: CHECK_OUT_HTML_EN.trim(),
    css: CHECK_OUT_CSS.trim(),
  },
  {
    documentType: DOCUMENT_TYPES.CHECK_OUT_CONTRACT,
    language: DOCUMENT_LANGUAGES.TURKISH,
    name: 'v1 - System Default',
    htmlBody: CHECK_OUT_HTML_TR.trim(),
    css: CHECK_OUT_CSS.trim(),
  },
  {
    documentType: DOCUMENT_TYPES.DORM_CERTIFICATE,
    language: DOCUMENT_LANGUAGES.ENGLISH,
    name: 'v1 - System Default',
    htmlBody: DORM_CERTIFICATE_HTML_EN.trim(),
    css: DORM_CERTIFICATE_CSS.trim(),
  },
  {
    documentType: DOCUMENT_TYPES.DORM_CERTIFICATE,
    language: DOCUMENT_LANGUAGES.TURKISH,
    name: 'v1 - System Default',
    htmlBody: DORM_CERTIFICATE_HTML_TR.trim(),
    css: DORM_CERTIFICATE_CSS.trim(),
  },
];
