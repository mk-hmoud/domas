import { InventoryScope } from '../../../common/enums/inventory-scope.enum';

export class BookingInventorySnapshot {
  id!: string;
  bookingId!: string;
  catalogId!: number;
  nameTr!: string;
  nameEn!: string;
  descriptionTr?: string;
  descriptionEn?: string;
  scope!: InventoryScope;
  priceTry!: number;
  priceForeign!: number;
  foreignCurrencyCode!: string;
  quantity!: number;
  locationName?: string;
  checkinRecordedAt?: Date;
  checkinRecordedBy?: string;
  checkoutRecordedAt?: Date;
  checkoutRecordedBy?: string;
  isDamaged!: boolean;
  damageNote?: string;
  createdAt!: Date;

  constructor(partial: Partial<BookingInventorySnapshot>) {
    Object.assign(this, partial);
  }
}
