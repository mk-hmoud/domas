import { InventoryScope } from "../enums/inventory-scope.enum";

export interface InventoryTemplate {
  id: number;
  name: string;
  description?: string;
  scope: InventoryScope;
  isActive: boolean;
  items?: InventoryTemplateItem[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface InventoryTemplateItem {
  id: number;
  templateId: number;
  catalogId: number;
  quantity: number;
  // Included for convenience in UI
  itemNameTr?: string;
  itemNameEn?: string;
}

export interface CreateInventoryTemplateDto {
  name: string;
  description?: string;
  scope: InventoryScope;
  items: {
    catalogId: number;
    quantity: number;
  }[];
}

export interface ApplyInventoryTemplateDto {
  templateId: number;
  locationIds?: number[];
  bedIds?: number[];
  replace?: boolean;
}
