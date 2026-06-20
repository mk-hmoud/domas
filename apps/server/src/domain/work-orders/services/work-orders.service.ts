import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../core/database/database.service';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { LocationsRepository } from '../../locations/repositories/locations.repository';
import { AccessRepository } from '../../users/repositories/access.repository';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { WorkOrdersRepository } from '../repositories/work-orders.repository';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { AssignWorkOrderDto } from '../dto/assign-work-order.dto';
import { UpdateWorkOrderStatusDto } from '../dto/update-work-order-status.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';
import { WorkOrderStatus } from '../../../common/enums/work-order-status.enum';
import { WorkOrderPriority } from '../../../common/enums/work-order-priority.enum';

const CLOSED_STATUSES = [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED];

// Status moves a Technician Staff member may make via PATCH /:id/status.
// Cancellation is a manager-only action, done via the generic edit endpoint.
const ALLOWED_STAFF_TRANSITIONS: Record<string, WorkOrderStatus[]> = {
  [WorkOrderStatus.PENDING]: [WorkOrderStatus.IN_PROGRESS],
  [WorkOrderStatus.ASSIGNED]: [WorkOrderStatus.IN_PROGRESS],
  [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.COMPLETED],
};

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly repository: WorkOrdersRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly accessRepository: AccessRepository,
    private readonly db: DatabaseService,
    private readonly locationScopeService: LocationScopeService,
  ) {}

  private isManager(context: AuditUserContext): boolean {
    return !!(
      context.isRecoveryAdmin || context.permissions?.includes(PERMISSIONS.WORK_ORDERS_MANAGE)
    );
  }

  async getAll(
    filters: { status?: WorkOrderStatus; priority?: WorkOrderPriority; locationId?: number },
    context: AuditUserContext,
  ): Promise<any[]> {
    if (this.isManager(context)) {
      return this.repository.findAll(filters, context.locationScope);
    }
    // Technician Staff: own assigned work orders only, independent of location scope.
    return this.repository.findAll({ ...filters, assignedTo: context.userId }, undefined);
  }

  async getAssignableTechnicians(context: AuditUserContext): Promise<any[]> {
    return this.repository.findAssignableTechnicians(context.locationScope);
  }

  async create(dto: CreateWorkOrderDto, context: AuditUserContext): Promise<any> {
    return this.db.transaction(async (client) => {
      const location = await this.locationsRepository.findById(dto.locationId, client);
      if (!location) throw new NotFoundException('Location not found');
      this.locationScopeService.assertAccess(context.locationScope, location.treePath);

      if (dto.assignedTo) {
        await this.assertAssignable(dto.assignedTo, client);
      }

      const workOrder = await this.repository.create(
        {
          title: dto.title,
          description: dto.description,
          locationId: dto.locationId,
          status: dto.assignedTo ? WorkOrderStatus.ASSIGNED : WorkOrderStatus.PENDING,
          priority: dto.priority ?? WorkOrderPriority.MEDIUM,
          assignedTo: dto.assignedTo,
          createdBy: context.userId,
          dueDate: dto.dueDate,
        },
        client,
      );

      return this.repository.findById(workOrder.id, client);
    });
  }

  async assign(id: string, dto: AssignWorkOrderDto, context: AuditUserContext): Promise<any> {
    return this.db.transaction(async (client) => {
      const workOrder = await this.repository.findById(id, client);
      if (!workOrder) throw new NotFoundException('Work order not found');
      this.locationScopeService.assertAccess(context.locationScope, workOrder.treePath);
      if (CLOSED_STATUSES.includes(workOrder.status)) {
        throw new BadRequestException('Cannot reassign a completed or cancelled work order');
      }

      await this.assertAssignable(dto.assignedTo, client);

      const updated = await this.repository.assign(id, dto.assignedTo, client);
      if (!updated) throw new NotFoundException('Work order not found');
      return updated;
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateWorkOrderStatusDto,
    context: AuditUserContext,
  ): Promise<any> {
    return this.db.transaction(async (client) => {
      const workOrder = await this.repository.findById(id, client);
      if (!workOrder) throw new NotFoundException('Work order not found');

      const isManager = this.isManager(context);
      if (!isManager && workOrder.assignedTo !== context.userId) {
        throw new ForbiddenException('You can only update work orders assigned to you');
      }
      if (CLOSED_STATUSES.includes(workOrder.status)) {
        throw new BadRequestException('This work order is already closed');
      }

      if (!isManager) {
        const allowed = ALLOWED_STAFF_TRANSITIONS[workOrder.status] ?? [];
        if (!allowed.includes(dto.status)) {
          throw new BadRequestException(
            `Cannot move work order from "${workOrder.status}" to "${dto.status}"`,
          );
        }
      }

      const updated = await this.repository.updateStatus(
        id,
        dto.status,
        dto.completionNotes,
        client,
      );
      if (!updated) throw new NotFoundException('Work order not found');
      return updated;
    });
  }

  async update(id: string, dto: UpdateWorkOrderDto, context: AuditUserContext): Promise<any> {
    return this.db.transaction(async (client) => {
      const workOrder = await this.repository.findById(id, client);
      if (!workOrder) throw new NotFoundException('Work order not found');
      this.locationScopeService.assertAccess(context.locationScope, workOrder.treePath);
      if (CLOSED_STATUSES.includes(workOrder.status)) {
        throw new BadRequestException('This work order is already closed');
      }
      if (dto.status !== undefined && dto.status !== WorkOrderStatus.CANCELLED) {
        throw new BadRequestException(
          'This endpoint can only be used to cancel a work order; use the assign/status endpoints for other transitions',
        );
      }

      if (dto.locationId !== undefined && dto.locationId !== workOrder.locationId) {
        const location = await this.locationsRepository.findById(dto.locationId, client);
        if (!location) throw new NotFoundException('Location not found');
        this.locationScopeService.assertAccess(context.locationScope, location.treePath);
      }

      const updated = await this.repository.update(id, dto, client);
      if (!updated) throw new NotFoundException('Work order not found');
      return updated;
    });
  }

  private async assertAssignable(userId: string, client: PoolClient): Promise<void> {
    const permissions = await this.accessRepository.getPermissionsForUser(userId, client);
    if (!permissions.includes(PERMISSIONS.WORK_ORDERS_UPDATE)) {
      throw new BadRequestException('Selected user is not a Technician Staff member');
    }
  }
}
