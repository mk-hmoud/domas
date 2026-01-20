import { GenderType } from '../../../common/enums/gender-type.enum';

export class Student {
  id!: string;
  userId?: string; // Optional link to User
  studentNumber!: string;
  firstName!: string;
  lastName!: string;
  gender!: GenderType;
  nationalityCode!: string;
  nationalId!: string;
  birthDate?: Date;
  email?: string;
  phoneNumber?: string;
  profileData?: any; // JSONB
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  createdByUserId?: string;

  constructor(partial: Partial<Student>) {
    Object.assign(this, partial);
  }
}
