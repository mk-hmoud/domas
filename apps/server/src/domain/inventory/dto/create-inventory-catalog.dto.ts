import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryScope } from '../../../common/enums/inventory-scope.enum';

export class CreateInventoryCatalogDto {
  @IsString()
  @IsNotEmpty()
  nameTr!: string;

  @IsString()
  @IsNotEmpty()
  nameEn!: string;

  @IsString()
  @IsOptional()
  descriptionTr?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsEnum(InventoryScope)
  @IsNotEmpty()
  scope!: InventoryScope;

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  basePriceTry!: number;

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  basePriceForeign!: number;

  @IsString()
  @IsNotEmpty()
  foreignCurrencyCode!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
