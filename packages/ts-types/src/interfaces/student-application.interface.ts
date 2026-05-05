import { GenderType } from "../enums/gender-type.enum";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface StudentApplication {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: GenderType;
  nationalityCode: string;
  nationalId: string;
  birthDate: string;
  birthPlace: string;
  department: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  letterFilename: string;
  letterMimeType: string;
  letterSize: number;
  letterUrl?: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  studentId?: string;
}

export interface SubmitApplicationDto {
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: GenderType;
  nationalityCode: string;
  nationalId: string;
  birthDate: string;
  birthPlace: string;
  department: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
}
