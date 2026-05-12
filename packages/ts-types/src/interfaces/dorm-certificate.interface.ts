import { EnrollmentVerification } from "./enrollment-verification.interface";

export type DormCertificateRequestStatus = "pending" | "approved" | "rejected";

export interface DormCertificateRequest {
  id: string;
  studentId: string;
  enrollmentVerificationId?: string;
  status: DormCertificateRequestStatus;
  rejectionReason?: string;
  certificateStorageKey?: string;
  certificateFilename?: string;
  certificateUrl?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  // joined fields returned by admin list
  studentName?: string;
  studentNumber?: string;
  enrollmentCertUrl?: string;
}

export interface DormCertificateEligibility {
  eligible: boolean;
  reason?: "account_pending" | "no_valid_certificate";
  validCert: EnrollmentVerification | null;
}
