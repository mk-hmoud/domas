export type EnrollmentVerificationStatus = 'pending' | 'verified' | 'rejected';

export class EnrollmentVerification {
  id!: string;
  studentId!: string;
  filename!: string;
  mimeType!: string;
  size!: number;
  storageKey!: string;
  status!: EnrollmentVerificationStatus;
  rejectionReason?: string;
  uploadedAt!: Date;
  reviewedAt?: Date;
  reviewedBy?: string;

  constructor(partial: Partial<EnrollmentVerification>) {
    Object.assign(this, partial);
  }
}
