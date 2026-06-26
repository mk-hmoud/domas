import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { GenderType } from '../../../common/enums/gender-type.enum';

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

export class BulkUpdateForeignerOnlyDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsBoolean()
  @IsNotEmpty()
  isForeignerOnly!: boolean;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}

export class BulkUpdateIsRectorateDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsBoolean()
  @IsNotEmpty()
  isRectorate!: boolean;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}
