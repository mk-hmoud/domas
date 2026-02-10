import { CardStatus } from '@domas/ts-types';

export class AccessCard {
  id!: number;
  batchId!: number;
  cardNumber!: number;
  status!: CardStatus;
  currentHolderId?: string;
  currentBookingId?: string;
  issuedAt?: Date;
  issuedBy?: string;
  returnedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<AccessCard>) {
    Object.assign(this, partial);
  }
}
