import { InventoryScope } from "../enums/inventory-scope.enum";

export interface CreateInventoryCatalogDto {
  nameTr: string;
  nameEn: string;
  descriptionTr?: string;
  descriptionEn?: string;
  scope: InventoryScope;
  basePriceTry: number;
  basePriceForeign: number;
  foreignCurrencyCode: string;
  isActive?: boolean;
  isOptional?: boolean;
}

export interface UpdateInventoryCatalogDto extends Partial<CreateInventoryCatalogDto> {}

export interface CreateInventoryAssignmentDto {
  catalogId: number;
  locationId?: number;
  bedId?: number;
  quantity: number;
  notes?: string;
}

export interface UpdateInventoryAssignmentDto {
  quantity: number;
  notes?: string;
}
