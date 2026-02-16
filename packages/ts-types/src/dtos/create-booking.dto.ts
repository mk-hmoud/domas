import { BookingOpsStatus } from "../enums/booking-ops-status.enum";
import { PaymentStatus } from "../enums/payment-status.enum";

export interface CreateBookingDto {
  studentId: string;
  bedId: number;
  semesterId: number;
  startDate: string;
  endDate: string;
  status?: BookingOpsStatus;
  paymentStatus?: PaymentStatus;
}

export interface CheckInBookingDto {
  selectedExtraCatalogIds?: number[];
  autoAssignCard?: boolean;
  specificCardNumber?: number;
}

export interface CheckOutBookingDto {
  notes?: string;
}
