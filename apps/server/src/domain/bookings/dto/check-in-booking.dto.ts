import { IsArray, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CheckInBookingDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  // These are the IDs of the 'inventory_catalog' items the student selected
  selectedExtraCatalogIds?: number[];

  @IsOptional()
  @IsBoolean()
  autoAssignCard?: boolean;

  @IsOptional()
  @IsInt()
  specificCardNumber?: number;
}
