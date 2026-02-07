import { InventoryCatalog } from './inventory-catalog.entity';

export class InventoryAssignment {
  id!: string;
  catalogId!: number;
  locationId?: number;
  bedId?: number;
  quantity!: number;
  notes?: string;
  createdAt!: Date;
  updatedAt!: Date;
  item?: InventoryCatalog;

  constructor(partial: Partial<InventoryAssignment>) {
    Object.assign(this, partial);
  }
}
