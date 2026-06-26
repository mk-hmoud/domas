import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';
import { LocationType } from '../../../common/enums/location-type.enum';
import { GenderType } from '../../../common/enums/gender-type.enum';

export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  nameTr?: string;

  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType;

  @IsEnum(GenderType)
  @IsOptional()
  genderLock?: GenderType;

  @IsBoolean()
  @IsOptional()
  isGuestZone?: boolean;

  @IsBoolean()
  @IsOptional()
  isTrOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  isForeignerOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  isRectorate?: boolean;

  @ValidateIf((o) => o.roomTypeId !== null)
  @IsInt()
  @IsOptional()
  roomTypeId?: number | null;
}
