import { GenderType } from "../enums/gender-type.enum";
import { BookingOpsStatus } from "../enums/booking-ops-status.enum";
import { PaymentStatus } from "../enums/payment-status.enum";
import { RoomChangeStatus } from "./room-change.interface";

export type StudentEnrollmentStatus = "pending" | "enrolled";

export interface Student {
  id: string;
  userId?: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: GenderType;
  nationalityCode: string;
  nationalId: string;
  birthDate: string;
  birthPlace: string;
  department: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  profileData?: any;
  photoUrl?: string;
  enrollmentVerified?: boolean;
  hasActiveBooking?: boolean;
  hasCompletedBooking?: boolean;
  isActive: boolean;
  enrollmentStatus: StudentEnrollmentStatus;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
}

// A room-change request nested inline under the booking it belongs to,
// as returned by GET /students/:id/history
export interface StudentHistoryRoomChange {
  id: string;
  status: RoomChangeStatus;
  note: string | null;
  rejectionReason: string | null;
  requiresPayment: boolean;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  currentBedLabel: string | null;
  requestedBedLabel: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// One booking row in a student's stay history, as returned by
// GET /students/:id/history
export interface StudentHistoryBooking {
  id: string;
  semesterId: number;
  semesterDisplayName: string;
  semesterType: string;
  academicYear: string;
  bedId: number;
  bedLabel: string;
  roomName: string;
  locationPath: string;
  status: BookingOpsStatus;
  paymentStatus: PaymentStatus;
  startDate: string;
  endDate: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  contractSigned: boolean;
  createdAt: string;
  roomChanges: StudentHistoryRoomChange[];
}
