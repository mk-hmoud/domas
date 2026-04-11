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
  birthDate!: Date;
  birthPlace!: string;
  department!: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  profileData?: any; // JSONB
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  createdByUserId?: string;

  constructor(partial: Partial<Student>) {
    Object.assign(this, partial);
  }
}
