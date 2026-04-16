import { IsArray, IsInt, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SemesterRoomPricingItemDto {
  @IsInt()
  roomTypeId!: number;

  @IsNumber()
  @Min(0)
  priceTry!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceForeign?: number | null;
}

export class SetSemesterPricingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SemesterRoomPricingItemDto)
  items!: SemesterRoomPricingItemDto[];
}
