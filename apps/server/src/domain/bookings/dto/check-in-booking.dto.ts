import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class CheckInBookingDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  // These are the IDs of the 'inventory_assignments' the student selected
  selectedExtraIds?: string[];
}
