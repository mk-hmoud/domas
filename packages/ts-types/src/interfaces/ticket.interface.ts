import { TicketStatus } from "../enums/ticket-status.enum";
import { TicketCategory } from "../enums/ticket-category.enum";
import { WorkOrderStatus } from "../enums/work-order-status.enum";

export interface Ticket {
  id: string;
  studentId: string;
  bookingId: string | null;
  locationId: number;
  category: TicketCategory;
  title: string;
  description: string;
  status: TicketStatus;
  workOrderId: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  resolutionNotes: string | null;
  rejectionReason: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Enriched view for the staff triage queue
export interface TicketView extends Ticket {
  locationName: string;
  locationPath: string;
  studentName: string;
  workOrderStatus: WorkOrderStatus | null;
  workOrderAssignedTo: string | null;
  workOrderAssignedToName: string | null;
  workOrderCompletedAt: string | null;
}

// Student-facing view
export interface StudentTicketView extends Ticket {
  locationName: string;
}
