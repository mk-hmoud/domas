import { IsOptional, IsString } from 'class-validator';

export class CheckOutBookingDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
