---
"@domas/api-client": minor
"@domas/ts-types": minor
---

Shared types and API client for the student portal

**`@domas/ts-types` — new `portal.interface.ts`:**

Portal-specific view types (enriched with joined data the portal queries return):

- `PortalSemester` — semester shape returned by `/portal/semesters`
- `AvailableBed` — bed with room name, location path, gender lock, base price
- `StudentBookingView` — booking with joined semester display name, bed label, room name, location path
- `StudentCurrentBooking` — extends `StudentBookingView` with financial details, contract URL, and access card info
- `StudentTransaction` — payment transaction with semester name
- `StudentDamageLiability` — damage charge with linked report info
- `StudentNotification` — in-app notification (id, type, title, body, metadata, readAt)
- `NotificationTypeValue` — union type of all notification type strings
- DTOs: `StudentLoginDto`, `UpdateStudentContactDto`, `StudentCreateBookingDto`

**`@domas/api-client` — new `portal.ts`:**

Five typed endpoint groups:

- `portalAuth` — `login`, `logout`, `me`
- `portalProfile` — `get`, `updateContact`
- `portalSemesters` — `getBookable`, `getAvailableBeds(semesterId)`
- `portalBookings` — `getAll`, `getCurrent`, `getById`, `create`, `downloadContract`
- `portalFinancial` — `getTransactions`, `getDamageLiabilities`
- `portalNotifications` — `getAll`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `stream` (returns a configured `EventSource` for live SSE delivery)
