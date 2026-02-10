import { CardActionType } from '../../../common/enums/card-action-type.enum';

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
