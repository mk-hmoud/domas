import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BedStatus } from '../../../common/enums/bed-status.enum';

export class UpdateBedDto {
  @IsNumber()
  @IsOptional()
  locationId?: number;

  @IsString()
  @IsOptional()
  label?: string;

  @IsEnum(BedStatus)
  @IsOptional()
  status?: BedStatus;
}
