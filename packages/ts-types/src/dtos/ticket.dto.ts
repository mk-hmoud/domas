import { TicketCategory } from "../enums/ticket-category.enum";
import { WorkOrderPriority } from "../enums/work-order-priority.enum";

export interface CreateTicketDto {
  category: TicketCategory;
  title: string;
  description: string;
}

export interface ResolveTicketDto {
  resolutionNotes: string;
}

export interface RejectTicketDto {
  rejectionReason: string;
}

export interface EscalateTicketDto {
  assignedTo?: string;
  priority?: WorkOrderPriority;
}
