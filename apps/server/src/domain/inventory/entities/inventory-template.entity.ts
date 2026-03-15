import { InventoryScope } from '../../../common/enums/inventory-scope.enum';

export class InventoryTemplate {
  id!: number;
  name!: string;
  description?: string;
  scope!: InventoryScope;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
  items?: InventoryTemplateItem[];

  constructor(partial: Partial<InventoryTemplate>) {
    Object.assign(this, partial);
  }
}

export class InventoryTemplateItem {
  id!: number;
  templateId!: number;
  catalogId!: number;
  quantity!: number;
  // Joins
  nameTr?: string;
  nameEn?: string;

  constructor(partial: Partial<InventoryTemplateItem>) {
    Object.assign(this, partial);
  }
}
