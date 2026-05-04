import { CardStatus } from "../enums/card-status.enum";
import { CardActionType } from "../enums/card-action-type.enum";

export interface CardBatch {
  id: number;
  locationId?: number;
  name: string;
  rangeStart: number;
  rangeEnd: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AccessCard {
  id: number;
  batchId: number;
  cardNumber: number;
  status: CardStatus;
  currentHolderId?: string;
  currentBookingId?: string;
  issuedAt?: string;
  issuedBy?: string;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
  holderName?: string;
}

export interface AccessCardLog {
  id: string;
  cardId: number;
  studentId?: string;
  bookingId?: string;
  actionType: CardActionType;
  performedBy: string;
  performedAt: string;
  notes?: string;
}
