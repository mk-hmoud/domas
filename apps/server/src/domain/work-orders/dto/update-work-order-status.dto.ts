import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkOrderStatus } from '../../../common/enums/work-order-status.enum';

export class UpdateWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus)
  status!: WorkOrderStatus;

  @IsOptional()
  @IsString()
  completionNotes?: string;
}
