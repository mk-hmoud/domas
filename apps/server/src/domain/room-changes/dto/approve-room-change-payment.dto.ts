import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApproveRoomChangePaymentDto {
  @IsBoolean()
  approved!: boolean;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
