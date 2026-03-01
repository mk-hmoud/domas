import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

export class UpdateBedTrOnlyDto {
  @IsBoolean()
  @IsNotEmpty()
  isTrOnly!: boolean;
}

export class UpdateBedForeignerOnlyDto {
  @IsBoolean()
  @IsNotEmpty()
  isForeignerOnly!: boolean;
}

export class UpdateBedGuestZoneDto {
  @IsBoolean()
  @IsNotEmpty()
  isGuestZone!: boolean;
}

export class UpdateBedOwnershipDto {
  @IsEnum(LocationOwnership)
  @IsNotEmpty()
  ownership!: LocationOwnership;
}
