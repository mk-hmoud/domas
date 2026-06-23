import { GenderType } from "../enums/gender-type.enum";

export interface ImportStudentRowDto {
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: GenderType;
  nationalityCode: string;
  nationalId: string;
  birthDate: string; // YYYY-MM-DD
  department: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;

  // Booking Info
  bedId?: number;
  semesterId?: number;
  startDate?: string;
  endDate?: string;
}

export interface BulkImportStudentsDto {
  students: ImportStudentRowDto[];
  dryRun?: boolean;
  updateExisting?: boolean;
}

export interface ImportRowResultDto {
  row: number;
  status: "success" | "error" | "skipped";
  error?: string;
  studentId?: string;
  bookingId?: string;
  data: ImportStudentRowDto;
}

export interface ImportResultDto {
  success: boolean;
  batchId?: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  results: ImportRowResultDto[];
}
