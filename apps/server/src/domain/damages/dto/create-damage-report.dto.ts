import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Length,
} from 'class-validator';

export class CreateDamageReportDto {
  @IsInt()
  @IsNotEmpty()
  locationId!: number;

  @IsInt()
  @IsOptional()
  snapshotId?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  manualCostTry?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  manualCostForeign?: number;

  @IsString()
  @Length(3, 3)
  @IsOptional()
  manualCurrencyCode?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  culpritIds?: string[];
}
