export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export class StudentApplication {
  id!: string;
  studentNumber!: string;
  firstName!: string;
  lastName!: string;
  gender!: string;
  nationalityCode!: string;
  nationalId!: string;
  birthDate!: Date;
  birthPlace!: string;
  department!: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  letterFilename!: string;
  letterMimeType!: string;
  letterSize!: number;
  letterStorageKey!: string;
  status!: ApplicationStatus;
  rejectionReason?: string;
  submittedAt!: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  studentId?: string;
  letterUrl?: string; // transient — presigned on demand

  constructor(partial: Partial<StudentApplication>) {
    Object.assign(this, partial);
  }
}
