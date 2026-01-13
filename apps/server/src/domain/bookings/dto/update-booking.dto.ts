import { IsDateString, IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { BookingOpsStatus } from '../../../common/enums/booking-ops-status.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class UpdateBookingDto {
  @IsEnum(BookingOpsStatus)
  @IsOptional()
  status?: BookingOpsStatus;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  contractSigned?: boolean;

  @IsString()
  @IsOptional()
  contractUrl?: string;
}
