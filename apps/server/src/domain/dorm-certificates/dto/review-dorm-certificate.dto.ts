import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewDormCertificateDto {
  @IsIn(['approve', 'reject'])
  action!: 'approve' | 'reject';

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
