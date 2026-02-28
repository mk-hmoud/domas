import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class BulkTransferBookingDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  bookingIds!: string[];

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
