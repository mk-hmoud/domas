import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import { NotificationsRepository, Notification } from '../repositories/notifications.repository';
import { RealtimeService } from '../../realtime/realtime.service';

export const NotificationType = {
  BOOKING_SUBMITTED: 'booking_submitted',
  BOOKING_APPROVED: 'booking_approved',
  BOOKING_REJECTED: 'booking_rejected',
  CHECKIN_CONFIRMED: 'checkin_confirmed',
  CHECKOUT_PROCESSED: 'checkout_processed',
  BOOKING_DATES_UPDATED: 'booking_dates_updated',
  DAMAGE_CHARGE: 'damage_charge',
  ACCESS_CARD_ISSUED: 'access_card_issued',
  PAYMENT_DEADLINE_REMINDER: 'payment_deadline_reminder',
  ROOM_CHANGE_APPROVED: 'room_change_approved',
  ROOM_CHANGE_REJECTED: 'room_change_rejected',
  ROOM_CHANGE_PENDING_PAYMENT: 'room_change_pending_payment',
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly realtime: RealtimeService,
  ) {}

  // ─── Creation ────────────────────────────────────────────────────────────────

  async create(
    studentId: string,
    type: NotificationTypeValue,
    title: string,
    body: string,
    metadata: Record<string, any> = {},
    sourceUndoLogId?: string | null,
  ): Promise<Notification> {
    try {
      const notification = await this.notificationsRepository.create({
        recipientType: 'student',
        recipientId: studentId,
        type,
        title,
        body,
        metadata,
        sourceUndoLogId,
      });

      // Push to live SSE stream if the student has an active connection
      this.realtime.publish(studentId, 'notification', notification);

      return notification;
    } catch (err: any) {
      // Notifications must never break the main business operation
      this.logger.error({ studentId, type, error: err.message }, 'Failed to create notification');
      return null as any;
    }
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async findByStudent(studentId: string, limit?: number, offset?: number): Promise<Notification[]> {
    return this.notificationsRepository.findByRecipient('student', studentId, limit, offset);
  }

  async countUnread(studentId: string): Promise<number> {
    return this.notificationsRepository.countUnread('student', studentId);
  }

  async markAsRead(id: string, studentId: string): Promise<boolean> {
    return this.notificationsRepository.markAsRead(id, 'student', studentId);
  }

  async markAllAsRead(studentId: string): Promise<void> {
    return this.notificationsRepository.markAllAsRead('student', studentId);
  }

  async deleteByUndoLogId(undoLogId: string | number, client?: PoolClient): Promise<number> {
    return this.notificationsRepository.deleteByUndoLogId(undoLogId, client);
  }
}
