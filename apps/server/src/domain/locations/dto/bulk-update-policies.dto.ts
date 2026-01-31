import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { GenderType } from '../../../common/enums/gender-type.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

export class BulkUpdateGenderLockDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsEnum(GenderType)
  @IsOptional()
  genderLock!: GenderType | null;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}

export class BulkUpdateGuestZoneDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsBoolean()
  @IsNotEmpty()
  isGuestZone!: boolean;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}

export class BulkUpdateTrOnlyDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsBoolean()
  @IsNotEmpty()
  isTrOnly!: boolean;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}

export class BulkUpdateOwnershipDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsEnum(LocationOwnership)
  @IsNotEmpty()
  ownership!: LocationOwnership;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}
