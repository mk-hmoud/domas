import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePreReservationDto {
  @IsInt()
  semesterId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  roomTypeId?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
