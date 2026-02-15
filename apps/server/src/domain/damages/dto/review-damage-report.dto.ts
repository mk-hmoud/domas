import { IsEnum, IsNotEmpty } from 'class-validator';
import { DamageStatus } from '../../../common/enums/damage-status.enum';

export class ReviewDamageReportDto {
  @IsEnum(DamageStatus)
  @IsNotEmpty()
  status!: DamageStatus;
}
