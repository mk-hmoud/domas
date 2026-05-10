import { IsOptional, IsString } from 'class-validator';

export class RejectPreReservationDto {
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
