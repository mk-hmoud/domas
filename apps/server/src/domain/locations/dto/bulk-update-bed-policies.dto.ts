import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

export class BulkUpdateBedTrOnlyDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsBoolean()
  @IsNotEmpty()
  isTrOnly!: boolean;
}

export class BulkUpdateBedForeignerOnlyDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsBoolean()
  @IsNotEmpty()
  isForeignerOnly!: boolean;
}

export class BulkUpdateBedGuestZoneDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsBoolean()
  @IsNotEmpty()
  isGuestZone!: boolean;
}

export class BulkUpdateBedOwnershipDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsEnum(LocationOwnership)
  @IsNotEmpty()
  ownership!: LocationOwnership;
}
