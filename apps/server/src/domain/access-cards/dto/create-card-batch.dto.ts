import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateCardBatchDto {
  @IsInt()
  @IsOptional()
  locationId?: number;

  @IsInt()
  @IsOptional()
  catalogId?: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  rangeStart!: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  rangeEnd!: number;
}
