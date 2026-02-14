import { IsEnum, IsNotEmpty } from 'class-validator';
import { DamageStatus } from '@domas/ts-types';

export class ReviewDamageReportDto {
  @IsEnum(DamageStatus)
  @IsNotEmpty()
  status!: DamageStatus;
}
