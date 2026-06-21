import { IsUUID } from 'class-validator';

export class AssignWorkOrderDto {
  @IsUUID()
  assignedTo!: string;
}
