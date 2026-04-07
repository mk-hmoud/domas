---
"server": minor
---

Notifications system (DB, SSE, lifecycle events)

Introduces a full in-app notification system for the student portal.

**New database migration:**

- `packages/database/06_student_notifications.sql` — `student_notifications` table with student FK, type, title, body, metadata JSONB, read_at, and indexed for fast unread queries.

**New `NotificationsModule`** (`src/domain/notifications/`):

- `NotificationsRepository` — create, paginated list, unread count, mark-one-read, mark-all-read.
- `NotificationsService` — wraps the repository; maintains a per-student RxJS `Subject` map for live delivery. `create()` is wrapped in try-catch so notification failures never break the calling business operation.
- `NotificationsController` — all endpoints under `/portal/notifications/`:
  - `GET /portal/notifications/stream` — SSE stream; frontend connects once and receives push events in real time. Subject is cleaned up on client disconnect.
  - `GET /portal/notifications` — paginated list (query params: `limit`, `offset`)
  - `GET /portal/notifications/unread-count` — badge count
  - `PATCH /portal/notifications/:id/read` — mark one notification read
  - `PATCH /portal/notifications/read-all` — mark all read

**Guard refactor:**

- `StudentAuthGuard` moved from `student-portal/guards/` to `common/guards/` so it can be used by `NotificationsController` without creating a circular module dependency.

**Lifecycle hooks in `BookingsService`:**

- `approveFinancials` (approved) → `BOOKING_APPROVED` notification
- `approveFinancials` (rejected) → `BOOKING_REJECTED` notification
- `checkIn` → `CHECKIN_CONFIRMED` notification
- `checkOut` → `CHECKOUT_PROCESSED` notification

All notifications are fired with `setImmediate()` after the DB transaction commits — they are decoupled from the transaction so a failed notification never rolls back a booking change.

**`StudentPortalService.createBooking`:**

- Fires `BOOKING_SUBMITTED` notification after the booking is persisted.

**Module wiring:**

- `NotificationsModule` added to `BookingsModule`, `StudentPortalModule`, and `AppModule`.
