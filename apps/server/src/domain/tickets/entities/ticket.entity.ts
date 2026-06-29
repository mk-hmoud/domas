import { TicketStatus } from '../../../common/enums/ticket-status.enum';
import { TicketCategory } from '../../../common/enums/ticket-category.enum';

export class Ticket {
  id!: string;
  studentId!: string;
  bookingId?: string;
  locationId!: number;
  category!: TicketCategory;
  title!: string;
  description!: string;
  status!: TicketStatus;
  workOrderId?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  resolutionNotes?: string;
  rejectionReason?: string;
  resolvedAt?: Date;
  photoKeys: string[] = [];
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Ticket>) {
    Object.assign(this, partial);
  }
}
