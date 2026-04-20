import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveRoomChangeDto {
  @IsBoolean()
  approved!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
