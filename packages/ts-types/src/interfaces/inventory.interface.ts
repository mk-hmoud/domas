import { InventoryScope } from "../enums/inventory-scope.enum";

export interface InventoryCatalogItem {
  id: number;
  nameTr: string;
  nameEn: string;
  descriptionTr?: string;
  descriptionEn?: string;
  scope: InventoryScope;
  basePriceTry: number;
  basePriceForeign: number;
  foreignCurrencyCode: string;
  isActive: boolean;
  isExtra: boolean;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface InventoryAssignment {
  id: string;
  catalogId: number;
  locationId?: number;
  bedId?: number;
  quantity: number;
  notes?: string;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
  item?: InventoryCatalogItem;
}

export interface BookingInventorySnapshot {
  id: string;
  bookingId: string;
  catalogId: number;
  nameTr: string;
  nameEn: string;
  descriptionTr?: string;
  descriptionEn?: string;
  scope: InventoryScope;
  priceTry: number;
  priceForeign: number;
  foreignCurrencyCode: string;
  quantity: number;
  locationName?: string;
  checkinRecordedAt?: string;
  checkinRecordedBy?: string;
  checkoutRecordedAt?: string;
  checkoutRecordedBy?: string;
  isDamaged: boolean;
  damageNote?: string;
  createdAt: string;
  updatedAt: string;
}
