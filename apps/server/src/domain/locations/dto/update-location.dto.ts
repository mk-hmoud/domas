import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LocationType } from '../../../common/enums/location-type.enum';

export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;
}
