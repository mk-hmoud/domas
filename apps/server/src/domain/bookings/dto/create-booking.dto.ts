import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @IsInt()
  @IsNotEmpty()
  bedId!: number;

  @IsInt()
  @IsNotEmpty()
  semesterId!: number;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsEnum(BookingOpsStatus)
  @IsOptional()
  status?: BookingOpsStatus = BookingOpsStatus.PENDING_ACCOUNTING;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus = PaymentStatus.PENDING;
}
