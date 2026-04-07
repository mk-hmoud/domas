import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import {
  NotificationsRepository,
  StudentNotification,
} from '../repositories/notifications.repository';

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
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /** In-process SSE subjects keyed by studentId. */
  private readonly subjects = new Map<string, Subject<StudentNotification>>();

  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  // ─── Creation ────────────────────────────────────────────────────────────────

  async create(
    studentId: string,
    type: NotificationTypeValue,
    title: string,
    body: string,
    metadata: Record<string, any> = {},
  ): Promise<StudentNotification> {
    try {
      const notification = await this.notificationsRepository.create({
        studentId,
        type,
        title,
        body,
        metadata,
      });

      // Push to live SSE stream if the student has an active connection
      const subject = this.subjects.get(studentId);
      if (subject) {
        subject.next(notification);
      }

      return notification;
    } catch (err: any) {
      // Notifications must never break the main business operation
      this.logger.error({ studentId, type, error: err.message }, 'Failed to create notification');
      return null as any;
    }
  }

  // ─── SSE ─────────────────────────────────────────────────────────────────────

  getOrCreateSubject(studentId: string): Subject<StudentNotification> {
    if (!this.subjects.has(studentId)) {
      this.subjects.set(studentId, new Subject<StudentNotification>());
    }
    return this.subjects.get(studentId)!;
  }

  removeSubject(studentId: string): void {
    const subject = this.subjects.get(studentId);
    if (subject) {
      subject.complete();
      this.subjects.delete(studentId);
    }
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async findByStudent(
    studentId: string,
    limit?: number,
    offset?: number,
  ): Promise<StudentNotification[]> {
    return this.notificationsRepository.findByStudent(studentId, limit, offset);
  }

  async countUnread(studentId: string): Promise<number> {
    return this.notificationsRepository.countUnread(studentId);
  }

  async markAsRead(id: string, studentId: string): Promise<boolean> {
    return this.notificationsRepository.markAsRead(id, studentId);
  }

  async markAllAsRead(studentId: string): Promise<void> {
    return this.notificationsRepository.markAllAsRead(studentId);
  }
}
