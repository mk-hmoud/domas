import { IsBoolean, IsNotEmpty } from 'class-validator';

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

export class UpdateBedIsRectorateDto {
  @IsBoolean()
  @IsNotEmpty()
  isRectorate!: boolean;
}
