import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewEnrollmentDto {
  @IsIn(['verify', 'reject'])
  action!: 'verify' | 'reject';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
