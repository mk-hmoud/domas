import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class Booking {
  id!: string;
  studentId!: string;
  bedId!: number;
  semesterId!: number;
  startDate!: Date;
  endDate!: Date;
  status!: BookingOpsStatus;
  paymentStatus!: PaymentStatus;
  isAccountingApproved!: boolean;
  accountingApprovedAt?: Date;
  accountingApprovedBy?: string;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  contractSigned!: boolean;
  contractUrl?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Booking>) {
    Object.assign(this, partial);
  }
}
