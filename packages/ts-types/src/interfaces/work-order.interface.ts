import { WorkOrderStatus } from "../enums/work-order-status.enum";
import { WorkOrderPriority } from "../enums/work-order-priority.enum";

export interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  locationId: number;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assignedTo: string | null;
  createdBy: string;
  dueDate: string | null;
  completionNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Enriched view returned by GET /work-orders
export interface WorkOrderView extends WorkOrder {
  locationName: string;
  locationPath: string;
  assignedToName: string | null;
  createdByName: string;
}

export interface AssignableTechnician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
