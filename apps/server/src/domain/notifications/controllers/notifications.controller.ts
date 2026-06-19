import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  OnModuleDestroy,
  Param,
  Patch,
  Query,
  Request,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable, finalize } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request as ExpressRequest } from 'express';
import { NotificationsService } from '../services/notifications.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { StudentAuthGuard } from '../../../common/guards/student-auth.guard';

@Controller('portal/notifications')
export class NotificationsController implements OnModuleDestroy {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly realtime: RealtimeService,
  ) {}

  onModuleDestroy() {
    // Nothing to clean up — subjects are cleaned up per-connection via finalize()
  }

  /**
   * SSE stream — the frontend connects once and receives every realtime
   * channel (notifications, messages, ...) for this student over one
   * connection. The connection is cleaned up when the client disconnects.
   */
  @UseGuards(StudentAuthGuard)
  @Sse('stream')
  stream(@Request() req: ExpressRequest): Observable<MessageEvent> {
    const studentId = req.session.studentId!;
    const subject = this.realtime.getOrCreateSubject(studentId);

    // Detect client disconnect and clean up the subject
    req.on('close', () => {
      this.realtime.removeSubject(studentId);
    });

    return subject.pipe(
      map((envelope) => ({ data: envelope }) as MessageEvent),
      finalize(() => this.realtime.removeSubject(studentId)),
    );
  }

  @UseGuards(StudentAuthGuard)
  @Get()
  async getAll(
    @Request() req: ExpressRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notificationsService.findByStudent(
      req.session.studentId!,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  @UseGuards(StudentAuthGuard)
  @Get('unread-count')
  async getUnreadCount(@Request() req: ExpressRequest) {
    const count = await this.notificationsService.countUnread(req.session.studentId!);
    return { count };
  }

  @UseGuards(StudentAuthGuard)
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string, @Request() req: ExpressRequest) {
    await this.notificationsService.markAsRead(id, req.session.studentId!);
    return { ok: true };
  }

  @UseGuards(StudentAuthGuard)
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: ExpressRequest) {
    await this.notificationsService.markAllAsRead(req.session.studentId!);
    return { ok: true };
  }
}
