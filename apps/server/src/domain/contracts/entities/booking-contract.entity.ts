import { ContractType } from '../../../common/enums/contract-type.enum';

export class BookingContract {
  bookingId!: string;
  type!: ContractType; // 'check_in', 'check_out'
  storageKey!: string;
  fileSize!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<BookingContract>) {
    Object.assign(this, partial);
  }
}
