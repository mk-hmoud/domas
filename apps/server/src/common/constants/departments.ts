// Duplicated from packages/ts-types/src/constants/departments.ts on purpose:
// production init scripts run standalone (ts-node) outside the monorepo
// workspace build, so they cannot resolve @domas/ts-types. Keep this file
// in sync with the ts-types version when adding/editing departments.
export interface DepartmentSeed {
  nameEn: string;
  nameTr: string;
}

// Seed data only - the `departments` table is the source of truth at runtime
// and is admin-editable. This list is used once to populate an empty table
// (see apps/server/scripts/init-production.ts).
export const DEPARTMENT_SEEDS: DepartmentSeed[] = [
  { nameEn: 'Computer Engineering', nameTr: 'Bilgisayar Mühendisliği' },
  { nameEn: 'Electrical Engineering', nameTr: 'Elektrik Mühendisliği' },
  { nameEn: 'Mechanical Engineering', nameTr: 'Makine Mühendisliği' },
  { nameEn: 'Civil Engineering', nameTr: 'İnşaat Mühendisliği' },
  { nameEn: 'Medicine', nameTr: 'Tıp' },
  { nameEn: 'Dentistry', nameTr: 'Diş Hekimliği' },
  { nameEn: 'Pharmacy', nameTr: 'Eczacılık' },
  { nameEn: 'Law', nameTr: 'Hukuk' },
  { nameEn: 'Psychology', nameTr: 'Psikoloji' },
  { nameEn: 'Architecture', nameTr: 'Mimarlık' },
  { nameEn: 'Business Administration', nameTr: 'İşletme' },
  { nameEn: 'Economics', nameTr: 'Ekonomi' },
  { nameEn: 'International Relations', nameTr: 'Uluslararası İlişkiler' },
  { nameEn: 'Political Science', nameTr: 'Siyaset Bilimi' },
  {
    nameEn: 'English Language and Literature',
    nameTr: 'İngiliz Dili ve Edebiyatı',
  },
  { nameEn: 'Education', nameTr: 'Eğitim Bilimleri' },
  { nameEn: 'Fine Arts', nameTr: 'Güzel Sanatlar' },
  { nameEn: 'Communication', nameTr: 'İletişim' },
  { nameEn: 'Nursing', nameTr: 'Hemşirelik' },
  { nameEn: 'Physiotherapy', nameTr: 'Fizyoterapi' },
];

// Flat English-name list, derived from the seeds above - kept for scripts
// that just need a plain string array (e.g. seed-students.ts) rather than
// the bilingual seed shape.
export const DEPARTMENTS = DEPARTMENT_SEEDS.map((d) => d.nameEn) as readonly string[];
export type DepartmentType = (typeof DEPARTMENTS)[number];
