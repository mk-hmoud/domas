import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

export class CreateBedDto {
  @IsNumber()
  @IsNotEmpty()
  locationId!: number;

  @IsString()
  @IsNotEmpty()
  label!: string;

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

  @IsEnum(LocationOwnership)
  @IsOptional()
  ownership?: LocationOwnership;
}
