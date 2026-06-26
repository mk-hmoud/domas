import { IsArray, IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

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

export class BulkUpdateBedIsRectorateDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsBoolean()
  @IsNotEmpty()
  isRectorate!: boolean;
}
