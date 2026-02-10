import { CardStatus } from "../enums/card-status.enum";
import { CardActionType } from "../enums/card-action-type.enum";

export interface CreateCardBatchDto {
  locationId?: number;
  name: string;
  rangeStart: number;
  rangeEnd: number;
}

export interface IssueCardDto {
  studentId: string;
  bookingId: string;
  batchId?: number;
  cardNumber?: number; // Optional: specific card or auto-pick
}

export interface ReturnCardDto {
  notes?: string;
}

export interface UpdateCardStatusDto {
  status: CardStatus;
  notes?: string;
}
