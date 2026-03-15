import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryScope } from '../../../common/enums/inventory-scope.enum';

class TemplateItemDto {
  @IsInt()
  @IsNotEmpty()
  catalogId!: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity!: number;
}

export class CreateInventoryTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(InventoryScope)
  @IsNotEmpty()
  scope!: InventoryScope;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items!: TemplateItemDto[];
}

export class ApplyInventoryTemplateDto {
  @IsInt()
  @IsNotEmpty()
  templateId!: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  locationIds?: number[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  bedIds?: number[];

  @IsBoolean()
  @IsOptional()
  replace?: boolean = false;
}
