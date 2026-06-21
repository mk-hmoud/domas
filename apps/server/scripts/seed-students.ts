import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { StudentsService } from '../src/domain/students/services/students.service';
import { UsersService } from '../src/domain/users/services/users.service';
import { GenderType } from '../src/common/enums/gender-type.enum';
import { DEPARTMENTS } from '../src/common/constants/departments';
import { CreateStudentDto } from '../src/domain/students/dto/create-student.dto';
import { AuditUserContext } from '../src/common/interfaces/audit-user-context.interface';

// Each entry seeds a nationality with name pools and a birth place.
// TR and TRNC are weighted heavier to reflect a realistic Cyprus/Turkey-based
// campus population; counts below must sum to STUDENT_COUNT.
//
// NOTE: 'TRNC' is not currently a valid nationalityCode end-to-end - the
// CreateStudentDto's @Length(2, 2) validator rejects anything but 2 chars,
// and the backend's seeded `countries` table doesn't include a TRNC row
// (it only exists in the frontend's country list). Students using TRNC
// below will fail to insert until that's fixed separately.
interface NationalitySeed {
  code: string;
  birthPlaces: string[];
  maleFirstNames: string[];
  femaleFirstNames: string[];
  lastNames: string[];
  count: number;
}

const NATIONALITIES: NationalitySeed[] = [
  {
    code: 'TR',
    birthPlaces: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya'],
    maleFirstNames: [
      'Ahmet',
      'Mehmet',
      'Mustafa',
      'Ali',
      'Hüseyin',
      'Yusuf',
      'Emre',
      'Burak',
      'Kerem',
      'Oğuz',
    ],
    femaleFirstNames: [
      'Ayşe',
      'Fatma',
      'Zeynep',
      'Elif',
      'Merve',
      'Cansu',
      'Selin',
      'Derya',
      'Esra',
      'Buse',
    ],
    lastNames: [
      'Yılmaz',
      'Kaya',
      'Demir',
      'Çelik',
      'Şahin',
      'Aydın',
      'Arslan',
      'Doğan',
      'Kılıç',
      'Aksoy',
    ],
    count: 10,
  },
  {
    code: 'TRNC',
    birthPlaces: ['Nicosia', 'Famagusta', 'Kyrenia'],
    maleFirstNames: ['Hasan', 'İsmail', 'Tahir', 'Erkan', 'Tolga', 'Cemal'],
    femaleFirstNames: ['Gül', 'Nazan', 'Sevim', 'Aylin', 'Berna', 'Hatice'],
    lastNames: ['Hüseyinoğlu', 'Necati', 'Özkan', 'Türkmen', 'Karagözlü', 'Mehmetoğlu'],
    count: 6,
  },
  {
    code: 'AZ',
    birthPlaces: ['Baku'],
    maleFirstNames: ['Elvin', 'Tural'],
    femaleFirstNames: ['Aysel', 'Günel'],
    lastNames: ['Aliyev', 'Mammadov', 'Aliyeva', 'Mammadova'],
    count: 2,
  },
  {
    code: 'IR',
    birthPlaces: ['Tehran'],
    maleFirstNames: ['Reza', 'Amir'],
    femaleFirstNames: ['Sara', 'Niloofar'],
    lastNames: ['Hosseini', 'Rostami'],
    count: 2,
  },
  {
    code: 'NG',
    birthPlaces: ['Lagos'],
    maleFirstNames: ['Chidi', 'Emeka'],
    femaleFirstNames: ['Ngozi', 'Amara'],
    lastNames: ['Okafor', 'Adeyemi'],
    count: 2,
  },
  {
    code: 'PK',
    birthPlaces: ['Lahore'],
    maleFirstNames: ['Hamza', 'Bilal'],
    femaleFirstNames: ['Ayesha', 'Sana'],
    lastNames: ['Khan', 'Malik'],
    count: 2,
  },
  {
    code: 'IQ',
    birthPlaces: ['Baghdad'],
    maleFirstNames: ['Karim', 'Yasir'],
    femaleFirstNames: ['Noor', 'Rania'],
    lastNames: ['Al-Hassan', 'Jabari'],
    count: 2,
  },
  {
    code: 'JO',
    birthPlaces: ['Amman'],
    maleFirstNames: ['Omar', 'Tariq'],
    femaleFirstNames: ['Lina', 'Dana'],
    lastNames: ['Haddad', 'Khalil'],
    count: 2,
  },
  {
    code: 'KZ',
    birthPlaces: ['Almaty'],
    maleFirstNames: ['Daniyar', 'Yerlan'],
    femaleFirstNames: ['Aigerim', 'Madina'],
    lastNames: ['Bekov', 'Suleimenov'],
    count: 2,
  },
  {
    code: 'RU',
    birthPlaces: ['Moscow'],
    maleFirstNames: ['Ivan', 'Dmitri'],
    femaleFirstNames: ['Anastasia', 'Olga'],
    lastNames: ['Ivanov', 'Petrova'],
    count: 2,
  },
  {
    code: 'DE',
    birthPlaces: ['Berlin'],
    maleFirstNames: ['Lukas', 'Felix'],
    femaleFirstNames: ['Hannah', 'Lea'],
    lastNames: ['Müller', 'Schmidt'],
    count: 2,
  },
  {
    code: 'GB',
    birthPlaces: ['London'],
    maleFirstNames: ['Oliver', 'Jack'],
    femaleFirstNames: ['Amelia', 'Sophie'],
    lastNames: ['Smith', 'Taylor'],
    count: 2,
  },
  {
    code: 'EG',
    birthPlaces: ['Cairo'],
    maleFirstNames: ['Mahmoud', 'Youssef'],
    femaleFirstNames: ['Mariam', 'Heba'],
    lastNames: ['Ibrahim', 'ElSayed'],
    count: 2,
  },
  {
    code: 'CN',
    birthPlaces: ['Beijing'],
    maleFirstNames: ['Wei', 'Jun'],
    femaleFirstNames: ['Mei', 'Lin'],
    lastNames: ['Wang', 'Li'],
    count: 2,
  },
];

const STUDENT_COUNT = NATIONALITIES.reduce((sum, n) => sum + n.count, 0);

// Registration cohorts: student numbers follow the existing convention seen
// across the app (e.g. "2024001" - 4-digit year + 3-digit sequence).
const REGISTRATION_YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function randomDigits(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

function buildTurkishNationalId(): string {
  // 11 digits, first digit cannot be 0.
  return `${1 + Math.floor(Math.random() * 9)}${randomDigits(10)}`;
}

function buildPassportNumber(countryCode: string, seq: number): string {
  return `${countryCode}${seq.toString().padStart(7, '0')}`;
}

function buildBirthDate(registrationYear: number): string {
  const age = 18 + Math.floor(Math.random() * 8); // 18-25 years old at registration
  const birthYear = registrationYear - age;
  const month = (1 + Math.floor(Math.random() * 12)).toString().padStart(2, '0');
  const day = (1 + Math.floor(Math.random() * 28)).toString().padStart(2, '0');
  return `${birthYear}-${month}-${day}`;
}

interface SeedRecord {
  dto: CreateStudentDto;
}

function buildSeedRecords(): SeedRecord[] {
  const records: SeedRecord[] = [];
  let globalSeq = 1;

  for (const nationality of NATIONALITIES) {
    const maleCount = Math.ceil(nationality.count / 2);
    const femaleCount = nationality.count - maleCount;
    const genders: GenderType[] = [
      ...Array(maleCount).fill(GenderType.MALE),
      ...Array(femaleCount).fill(GenderType.FEMALE),
    ];

    for (let i = 0; i < nationality.count; i++) {
      const gender = genders[i];
      const firstName =
        gender === GenderType.MALE
          ? pick(nationality.maleFirstNames, i)
          : pick(nationality.femaleFirstNames, i);
      const lastName = pick(nationality.lastNames, i);
      const registrationYear = pick(REGISTRATION_YEARS, globalSeq);
      const studentNumber = `${registrationYear}${globalSeq.toString().padStart(3, '0')}`;
      const nationalId =
        nationality.code === 'TR'
          ? buildTurkishNationalId()
          : buildPassportNumber(nationality.code, globalSeq);
      const department = pick(DEPARTMENTS as unknown as string[], globalSeq);
      const email = `${firstName}.${lastName}.${studentNumber}@test.com`
        .toLowerCase()
        .replace(/[^a-z0-9.@]/g, '');

      records.push({
        dto: {
          studentNumber,
          firstName,
          lastName,
          gender,
          nationalityCode: nationality.code,
          nationalId,
          birthDate: buildBirthDate(registrationYear),
          birthPlace: pick(nationality.birthPlaces, i),
          department,
          email,
        },
      });

      globalSeq++;
    }
  }

  return records;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const studentsService = app.get(StudentsService);
  const usersService = app.get(UsersService);
  const logger = new Logger('StudentSeed');

  const adminUser = await usersService.findByEmail('recovery_admin@dorm.com');
  if (!adminUser) {
    logger.error('Recovery admin not found. Please run npm run init:prod first.');
    await app.close();
    return;
  }

  const seedContext: AuditUserContext = {
    userId: adminUser.id,
    username: 'student_seed_script',
    ipAddress: '127.0.0.1',
    userAgent: 'Student Seed Script',
  };

  try {
    logger.log(`Seeding ${STUDENT_COUNT} students...`);

    const records = buildSeedRecords();
    const existing = await studentsService.findAll({ page: 1, limit: 1000 }, seedContext);
    const existingNumbers = new Set(existing.data.map((s) => s.studentNumber));

    let created = 0;
    let skipped = 0;

    for (const record of records) {
      if (existingNumbers.has(record.dto.studentNumber)) {
        skipped++;
        continue;
      }

      await studentsService.create(record.dto, seedContext);
      created++;
      logger.log(
        `Created ${record.dto.studentNumber}: ${record.dto.firstName} ${record.dto.lastName} (${record.dto.nationalityCode}, ${record.dto.gender})`,
      );
    }

    logger.log(
      `✅ Student seed finished. Created ${created}, skipped ${skipped} (already existed).`,
    );
  } catch (error) {
    logger.error('Student seeding failed', error);
  } finally {
    await app.close();
  }
}

bootstrap();
