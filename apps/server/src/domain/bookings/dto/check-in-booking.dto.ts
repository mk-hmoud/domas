import { IsArray, IsOptional, IsInt } from 'class-validator';

export class CheckInBookingDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  // These are the IDs of the 'inventory_catalog' items the student selected
  selectedExtraCatalogIds?: number[];
}
