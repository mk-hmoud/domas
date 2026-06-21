import { WorkOrderPriority } from "../enums/work-order-priority.enum";
import { WorkOrderStatus } from "../enums/work-order-status.enum";

export interface CreateWorkOrderDto {
  title: string;
  description?: string;
  locationId: number;
  priority?: WorkOrderPriority;
  assignedTo?: string;
  dueDate?: string;
}

export interface AssignWorkOrderDto {
  assignedTo: string;
}

export interface UpdateWorkOrderStatusDto {
  status: WorkOrderStatus;
  completionNotes?: string;
}

export interface UpdateWorkOrderDto {
  title?: string;
  description?: string;
  locationId?: number;
  priority?: WorkOrderPriority;
  dueDate?: string;
  // Only used to cancel a work order — other transitions go through
  // the dedicated assign/status endpoints.
  status?: WorkOrderStatus;
}
