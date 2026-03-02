import { IsDateString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class TransferBookingDto {
  @IsInt()
  @IsNotEmpty()
  targetSemesterId!: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
