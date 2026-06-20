import { WorkOrderStatus } from '../../../common/enums/work-order-status.enum';
import { WorkOrderPriority } from '../../../common/enums/work-order-priority.enum';

export class WorkOrder {
  id!: string;
  title!: string;
  description?: string;
  locationId!: number;
  status!: WorkOrderStatus;
  priority!: WorkOrderPriority;
  assignedTo?: string;
  createdBy!: string;
  dueDate?: Date;
  completionNotes?: string;
  completedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<WorkOrder>) {
    Object.assign(this, partial);
  }
}
