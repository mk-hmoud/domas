import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryAssignmentDto {
  @IsInt()
  @IsNotEmpty()
  catalogId!: number;

  @IsInt()
  @IsOptional()
  locationId?: number;

  @IsInt()
  @IsOptional()
  bedId?: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
