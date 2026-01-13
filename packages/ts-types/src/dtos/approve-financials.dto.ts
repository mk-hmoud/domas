import { PaymentStatus } from "../enums/payment-status.enum";

export interface ApproveFinancialsDto {
  approved: boolean;
  paymentStatus?: PaymentStatus;
  notes?: string;
}
