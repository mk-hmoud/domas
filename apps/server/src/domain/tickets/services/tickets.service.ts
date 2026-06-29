import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LocationScopeService } from '../../../core/location-scope/location-scope.service';
import { StudentPortalService } from '../../student-portal/services/student-portal.service';
import { WorkOrdersService } from '../../work-orders/services/work-orders.service';
import {
  NotificationsService,
  NotificationType,
} from '../../notifications/services/notifications.service';
import { StorageService } from '../../../common/storage/storage.service';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { TicketsRepository } from '../repositories/tickets.repository';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { ResolveTicketDto } from '../dto/resolve-ticket.dto';
import { RejectTicketDto } from '../dto/reject-ticket.dto';
import { EscalateTicketDto } from '../dto/escalate-ticket.dto';
import { TicketStatus } from '../../../common/enums/ticket-status.enum';
import { TicketCategory } from '../../../common/enums/ticket-category.enum';

@Injectable()
export class TicketsService {
  constructor(
    private readonly repository: TicketsRepository,
    private readonly studentPortalService: StudentPortalService,
    @Inject(forwardRef(() => WorkOrdersService))
    private readonly workOrdersService: WorkOrdersService,
    private readonly notificationsService: NotificationsService,
    private readonly locationScopeService: LocationScopeService,
    private readonly storage: StorageService,
  ) {}

  // ─── Student Portal ───────────────────────────────────────────────────────────

  async createTicket(
    studentId: string,
    dto: CreateTicketDto,
    photos: Express.Multer.File[] = [],
  ): Promise<any> {
    const booking = await this.studentPortalService.getCurrentBooking(studentId);
    if (!booking) {
      throw new BadRequestException('You need an active booking to report an issue');
    }

    const photoKeys = await Promise.all(
      photos.map(async (file) => {
        const key = `tickets/${studentId}/${randomUUID()}`;
        await this.storage.upload(key, file.buffer, file.mimetype);
        return key;
      }),
    );

    const ticket = await this.repository.create({
      studentId,
      bookingId: booking.id,
      locationId: booking.roomId,
      category: dto.category,
      title: dto.title,
      description: dto.description,
      photoKeys,
    });

    return { ...ticket, photoUrls: await this.resolvePhotoUrls(ticket.photoKeys) };
  }

  async getMyTickets(studentId: string): Promise<any[]> {
    const tickets = await this.repository.findByStudent(studentId);
    return Promise.all(
      tickets.map(async (t) => ({
        ...t,
        photoUrls: await this.resolvePhotoUrls(t.photoKeys ?? []),
      })),
    );
  }

  private async resolvePhotoUrls(keys: string[]): Promise<string[]> {
    if (!keys?.length) return [];
    return Promise.all(keys.map((k) => this.storage.presign(k, 3600)));
  }

  // ─── Staff ────────────────────────────────────────────────────────────────────

  async getAll(
    filters: { status?: TicketStatus; category?: TicketCategory },
    context: AuditUserContext,
  ): Promise<any[]> {
    return this.repository.findAll(filters, context.locationScope);
  }

  async resolve(id: string, dto: ResolveTicketDto, context: AuditUserContext): Promise<any> {
    const ticket = await this.repository.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.locationScopeService.assertAccess(context.locationScope, ticket.treePath);
    if (ticket.status !== TicketStatus.OPEN) {
      throw new BadRequestException('This ticket has already been triaged');
    }

    const updated = await this.repository.resolve(id, {
      resolutionNotes: dto.resolutionNotes,
      reviewedBy: context.userId,
    });
    if (!updated) throw new NotFoundException('Ticket not found or already triaged');

    setImmediate(() =>
      this.notificationsService.create(
        ticket.studentId,
        NotificationType.TICKET_RESOLVED,
        'Issue Resolved',
        `Your report "${ticket.title}" has been resolved: ${dto.resolutionNotes}`,
        { ticketId: id },
      ),
    );

    return updated;
  }

  async reject(id: string, dto: RejectTicketDto, context: AuditUserContext): Promise<any> {
    const ticket = await this.repository.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.locationScopeService.assertAccess(context.locationScope, ticket.treePath);
    if (ticket.status !== TicketStatus.OPEN) {
      throw new BadRequestException('This ticket has already been triaged');
    }

    const updated = await this.repository.reject(id, {
      rejectionReason: dto.rejectionReason,
      reviewedBy: context.userId,
    });
    if (!updated) throw new NotFoundException('Ticket not found or already triaged');

    setImmediate(() =>
      this.notificationsService.create(
        ticket.studentId,
        NotificationType.TICKET_REJECTED,
        'Report Closed',
        `Your report "${ticket.title}" was reviewed: ${dto.rejectionReason}`,
        { ticketId: id },
      ),
    );

    return updated;
  }

  async escalate(id: string, dto: EscalateTicketDto, context: AuditUserContext): Promise<any> {
    const ticket = await this.repository.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.locationScopeService.assertAccess(context.locationScope, ticket.treePath);
    if (ticket.status !== TicketStatus.OPEN) {
      throw new BadRequestException('This ticket has already been triaged');
    }

    // WorkOrdersService.create manages its own transaction; it isn't nested in
    // one here so a failure on the (rare) follow-up update doesn't roll back
    // a perfectly valid work order — it just leaves it temporarily unlinked.
    const workOrder = await this.workOrdersService.create(
      {
        title: ticket.title,
        description: ticket.description,
        locationId: ticket.locationId,
        priority: dto.priority,
        assignedTo: dto.assignedTo,
      },
      context,
    );

    const updated = await this.repository.escalate(id, {
      workOrderId: workOrder.id,
      reviewedBy: context.userId,
    });
    if (!updated) throw new NotFoundException('Ticket not found or already triaged');

    setImmediate(() =>
      this.notificationsService.create(
        ticket.studentId,
        NotificationType.TICKET_ESCALATED,
        'Issue Escalated',
        `Your report "${ticket.title}" has been assigned to a technician.`,
        { ticketId: id, workOrderId: workOrder.id },
      ),
    );

    return updated;
  }

  // ─── Cross-domain hook (called from WorkOrdersService on completion) ──────────

  async onWorkOrderCompleted(workOrderId: string): Promise<void> {
    const ticket = await this.repository.markResolvedFromWorkOrder(workOrderId);
    if (!ticket) return;

    setImmediate(() =>
      this.notificationsService.create(
        ticket.studentId,
        NotificationType.TICKET_RESOLVED,
        'Issue Resolved',
        `Your report "${ticket.title}" has been resolved by a technician.`,
        { ticketId: ticket.id, workOrderId },
      ),
    );
  }
}
