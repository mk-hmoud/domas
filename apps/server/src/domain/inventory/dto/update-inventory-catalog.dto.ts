import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
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
  @IsOptional()
  basePriceTry?: number;

  @IsNumber()
  @IsOptional()
  basePriceForeign?: number;

  @IsString()
  @IsOptional()
  foreignCurrencyCode?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
