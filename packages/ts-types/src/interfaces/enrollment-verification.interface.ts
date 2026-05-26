export type EnrollmentVerificationStatus = "pending" | "verified" | "rejected";

export interface EnrollmentVerification {
  id: string;
  studentId: string;
  filename: string;
  mimeType: string;
  size: number;
  storageKey?: string;
  url?: string;
  status: EnrollmentVerificationStatus;
  expiryDate?: string;
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface EnrollmentStatus {
  enrollmentVerified: boolean;
  hasActiveBooking: boolean;
  hasCompletedBooking: boolean;
  latestCert: EnrollmentVerification | null;
}
