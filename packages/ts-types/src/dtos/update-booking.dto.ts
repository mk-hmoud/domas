import { BookingOpsStatus } from "../enums/booking-ops-status.enum";
import { PaymentStatus } from "../enums/payment-status.enum";

export interface UpdateBookingDto {
  status?: BookingOpsStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  contractSigned?: boolean;
  contractUrl?: string;
}
