import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class StudentCreateRoomChangeDto {
  @IsInt()
  requestedBedId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
