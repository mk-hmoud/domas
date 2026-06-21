import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { WorkOrderPriority } from '../../../common/enums/work-order-priority.enum';

export class EscalateTicketDto {
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;
}
