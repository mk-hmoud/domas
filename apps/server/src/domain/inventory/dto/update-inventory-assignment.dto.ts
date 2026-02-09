import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateInventoryAssignmentDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity!: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  isOptional?: boolean;
}
