import { IsInt, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class IssueCardDto {
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @IsUUID()
  @IsNotEmpty()
  bookingId!: string;

  @IsInt()
  @IsOptional()
  batchId?: number;

  @IsInt()
  @IsOptional()
  cardNumber?: number;
}
