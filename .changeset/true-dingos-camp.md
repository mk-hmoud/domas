---
"@domas/api-client": minor
"server": minor
---

Room Change Server: new RoomChangesModule with student portal endpoints (GET/POST/DELETE `/portal/room-changes`), staff endpoints (GET `/room-changes`, PATCH `/room-changes/:id/resolve`, POST `/room-changes/bookings/:id/move-bed`). Semester `max_room_changes` field wired through entity, repository, and DTO. Notification types `room_change_approved`/`room_change_rejected` added. Staff move-bed is unlimited and never increments the counter.
