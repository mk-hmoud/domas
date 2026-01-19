import { GenderType } from "../enums/gender-type.enum";

export interface UpdateStudentDto {
  studentNumber?: string;
  firstName?: string;
  lastName?: string;
  gender?: GenderType;
  nationalityCode?: string;
  email?: string;
  phoneNumber?: string;
  userId?: string;
  isActive?: boolean;
}
