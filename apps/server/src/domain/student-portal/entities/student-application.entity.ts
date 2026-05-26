export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ApplicationDocumentType = 'freshman' | 'returning';

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
  documentFilename!: string;
  documentMimeType!: string;
  documentSize!: number;
  documentStorageKey!: string;
  documentType!: ApplicationDocumentType;
  documentExpiryDate?: Date;
  status!: ApplicationStatus;
  rejectionReason?: string;
  submittedAt!: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  studentId?: string;
  documentUrl?: string; // transient — presigned on demand

  constructor(partial: Partial<StudentApplication>) {
    Object.assign(this, partial);
  }
}
