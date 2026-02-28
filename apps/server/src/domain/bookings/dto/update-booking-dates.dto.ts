import { IsDateString, IsOptional } from 'class-validator';

export class UpdateBookingDatesDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
