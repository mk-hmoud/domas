export type GuestStayStatus = 'confirmed' | 'active' | 'completed' | 'cancelled';

export class GuestStay {
  id!: string;
  guestId!: string;
  bedId!: number;
  checkInDate!: string;
  checkOutDate!: string;
  actualCheckIn?: Date;
  actualCheckOut?: Date;
  status!: GuestStayStatus;
  paymentRequired!: boolean;
  amountDue?: number;
  amountPaid!: number;
  currency!: string;
  paymentNotes?: string;
  notes?: string;
  createdBy!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<GuestStay>) {
    Object.assign(this, partial);
  }
}
