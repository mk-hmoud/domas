import { GenderType } from "../enums/gender-type.enum";

export interface CreateStudentDto {
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: GenderType;
  nationalityCode: string;
  nationalId: string;
  birthDate?: string;
  email?: string;
  phoneNumber?: string;
  userId?: string;
}
