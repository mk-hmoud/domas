import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class StudentCreateRoomChangeDto {
  @IsOptional()
  @IsInt()
  requestedBedId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
