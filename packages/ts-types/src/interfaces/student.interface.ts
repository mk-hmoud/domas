import { GenderType } from "../enums/gender-type.enum";

export interface Student {
  id: string;
  userId?: string;
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
  profileData?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
}
