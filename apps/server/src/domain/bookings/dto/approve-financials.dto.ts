import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';

export class ApproveFinancialsDto {
  @IsBoolean()
  @IsNotEmpty()
  approved!: boolean;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
