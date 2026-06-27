import { IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { LocationType } from '../../../common/enums/location-type.enum';
import { GenderType } from '../../../common/enums/gender-type.enum';
import { BedStatus } from '../../../common/enums/bed-status.enum';

export class FindAllLocationsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType;

  @IsEnum(GenderType)
  @IsOptional()
  genderLock?: GenderType;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isTrOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isForeignerOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isGuestZone?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isRectorate?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  parentId?: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  onlyVacant?: boolean;

  @IsEnum(BedStatus)
  @IsOptional()
  status?: BedStatus;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  roomTypeId?: number;

  @IsString()
  @IsOptional()
  orderBy?: string;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  orderDir?: 'asc' | 'desc';
}
