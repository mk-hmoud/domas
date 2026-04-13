import { GenderType } from "../enums/gender-type.enum";

export interface UpdateStudentDto {
  studentNumber?: string;
  firstName?: string;
  lastName?: string;
  gender?: GenderType;
  nationalityCode?: string;
  nationalId?: string;
  birthDate?: string;
  birthPlace?: string;
  department?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  userId?: string;
  isActive?: boolean;
}
