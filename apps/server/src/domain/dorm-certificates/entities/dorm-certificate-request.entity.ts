export type DormCertificateRequestStatus = 'pending' | 'approved' | 'rejected';

export class DormCertificateRequest {
  id!: string;
  studentId!: string;
  enrollmentVerificationId?: string;
  status!: DormCertificateRequestStatus;
  rejectionReason?: string;
  certificateStorageKey?: string;
  certificateFilename?: string;
  requestedAt!: Date;
  reviewedAt?: Date;
  reviewedBy?: string;

  // transient — presigned on demand
  certificateUrl?: string;

  constructor(partial: Partial<DormCertificateRequest>) {
    Object.assign(this, partial);
  }
}
