import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryScope } from '../../../common/enums/inventory-scope.enum';

export class UpdateInventoryCatalogDto {
  @IsString()
  @IsOptional()
  nameTr?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  descriptionTr?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsEnum(InventoryScope)
  @IsOptional()
  scope?: InventoryScope;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  basePriceTry?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  basePriceForeign?: number;

  @IsString()
  @IsOptional()
  foreignCurrencyCode?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isExtra?: boolean;

  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;
}
