import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
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

  @IsBoolean()
  @IsOptional()
  isTrOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  isForeignerOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  isGuestZone?: boolean;

  @IsBoolean()
  @IsOptional()
  isRectorate?: boolean;
}
