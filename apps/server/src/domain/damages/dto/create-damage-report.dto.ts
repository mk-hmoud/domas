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
  ValidateIf,
} from 'class-validator';

export class CreateDamageReportDto {
  @IsInt()
  @IsNotEmpty()
  locationId!: number;

  @IsInt()
  @IsOptional()
  snapshotId?: number;

  @IsInt()
  @IsOptional()
  catalogId?: number;

  @ValidateIf((o) => !o.snapshotId && !o.catalogId)
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  manualCostTry?: number;

  @ValidateIf((o) => !o.snapshotId && !o.catalogId)
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
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

  @IsBoolean()
  @IsOptional()
  autoApprove?: boolean;
}
