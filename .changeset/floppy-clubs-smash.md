---
"@domas/database": minor
"@domas/ts-types": minor
---

Open room change requests: database schema and shared types.

**Database (`@domas/database`)**

- `room_change_requests.requested_bed_id` is now nullable. A `NULL` value means the student submitted an open request — no specific bed was requested; staff will assign one at approval time.

**Shared types (`@domas/ts-types`)**

- `RoomChangeRequest.requestedBedId` typed as `number | null`.
- `RoomChangeRequestView.requestedBedLabel` and `requestedLocationPath` typed as `string | null`.
- `StudentRoomChangeView.requestedBedLabel` and `requestedLocationPath` typed as `string | null`.
- `StudentCreateRoomChangeDto.requestedBedId` is now optional (omit to create an open request).
- `ResolveRoomChangeDto` gains an optional `assignedBedId: number` field — staff provides this when approving an open request.
