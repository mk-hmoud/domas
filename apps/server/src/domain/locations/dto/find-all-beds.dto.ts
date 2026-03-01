import { IsEnum, IsOptional, IsInt, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { BedStatus } from '../../../common/enums/bed-status.enum';
import { GenderType } from '../../../common/enums/gender-type.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

export class FindAllBedsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  locationId?: number;

  @IsOptional()
  @IsEnum(BedStatus)
  status?: BedStatus;

  @IsOptional()
  @IsEnum(GenderType)
  genderLock?: GenderType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isTrOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isForeignerOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isGuestZone?: boolean;

  @IsOptional()
  @IsEnum(LocationOwnership)
  ownership?: LocationOwnership;
}
