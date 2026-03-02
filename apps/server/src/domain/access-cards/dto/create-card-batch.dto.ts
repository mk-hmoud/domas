import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCardBatchDto {
  @IsInt()
  @IsOptional()
  locationId?: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  rangeStart!: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  rangeEnd!: number;
}
