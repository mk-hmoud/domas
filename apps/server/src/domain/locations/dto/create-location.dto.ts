import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { LocationType } from '../../../common/enums/location-type.enum';
import { GenderType } from '../../../common/enums/gender-type.enum';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  nameTr?: string;

  @IsNumber()
  @IsOptional()
  parentId?: number;

  @IsEnum(LocationType)
  type!: LocationType;

  @IsEnum(GenderType)
  @IsOptional()
  genderLock?: GenderType;

  @IsBoolean()
  @IsOptional()
  isGuestZone?: boolean;

  @IsBoolean()
  @IsOptional()
  isTrOnly?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isForeignerOnly?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isRectorate?: boolean = false;

  @ValidateIf((o) => o.type === LocationType.ROOM)
  @IsInt()
  @IsNotEmpty()
  roomTypeId?: number;
}
