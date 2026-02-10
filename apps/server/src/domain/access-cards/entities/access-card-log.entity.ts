import { CardActionType } from '@domas/ts-types';

export class AccessCardLog {
  id!: string;
  cardId!: number;
  studentId?: string;
  bookingId?: string;
  actionType!: CardActionType;
  performedBy!: string;
  performedAt!: Date;
  notes?: string;

  constructor(partial: Partial<AccessCardLog>) {
    Object.assign(this, partial);
  }
}
