import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export interface FindAllBookingsDto {
  studentId?: string;
  semesterId?: number;
  locationId?: number;
  bedId?: number;
  status?: BookingOpsStatus;
  paymentStatus?: PaymentStatus;
}
