import { InventoryScope } from '../../../common/enums/inventory-scope.enum';

export class InventoryCatalog {
  id!: number;
  nameTr!: string;
  nameEn!: string;
  descriptionTr?: string;
  descriptionEn?: string;
  scope!: InventoryScope;
  basePriceTry!: number;
  basePriceForeign!: number;
  foreignCurrencyCode!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;

  constructor(partial: Partial<InventoryCatalog>) {
    Object.assign(this, partial);
  }
}
