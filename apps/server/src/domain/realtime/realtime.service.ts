import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface RealtimeEnvelope<T = unknown> {
  channel: string;
  data: T;
}

/**
 * Shared per-recipient SSE subject map. A single subject multiplexes every
 * channel (notifications, messages, ...) for a recipient so the frontend
 * only needs one EventSource connection.
 */
@Injectable()
export class RealtimeService {
  private readonly subjects = new Map<string, Subject<RealtimeEnvelope>>();

  getOrCreateSubject(key: string): Subject<RealtimeEnvelope> {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<RealtimeEnvelope>());
    }
    return this.subjects.get(key)!;
  }

  removeSubject(key: string): void {
    const subject = this.subjects.get(key);
    if (subject) {
      subject.complete();
      this.subjects.delete(key);
    }
  }

  publish<T>(key: string, channel: string, data: T): void {
    const subject = this.subjects.get(key);
    if (subject) {
      subject.next({ channel, data });
    }
  }
}
