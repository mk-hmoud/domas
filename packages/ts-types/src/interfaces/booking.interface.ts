import { BookingOpsStatus } from "../enums/booking-ops-status.enum";
import { PaymentStatus } from "../enums/payment-status.enum";

export interface Booking {
  id: string;
  studentId: string;
  bedId: number;
  semesterId: number;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  status: BookingOpsStatus;
  paymentStatus: PaymentStatus;
  isAccountingApproved: boolean;
  accountingApprovedAt?: string; // ISO Date string
  accountingApprovedBy?: string;
  checkedInAt?: string; // ISO Date string
  checkedOutAt?: string; // ISO Date string
  contractSigned: boolean;
  contractUrl?: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}
