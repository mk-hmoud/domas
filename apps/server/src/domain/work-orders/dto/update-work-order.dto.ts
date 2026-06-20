import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkOrderPriority } from '../../../common/enums/work-order-priority.enum';
import { WorkOrderStatus } from '../../../common/enums/work-order-status.enum';

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  locationId?: number;

  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  // Only used to cancel a work order from the edit dialog — other status
  // transitions go through the dedicated assign/status endpoints.
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;
}
