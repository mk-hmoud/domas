---
"server": minor
---

Open room change requests: server repository, service, and DTOs.

**Repository (`RoomChangesRepository`)**

- `findAll()` and `findByStudent()`: changed `JOIN beds rb` / `JOIN locations rl` to `LEFT JOIN` so open requests (no `requested_bed_id`) are not filtered out.
- `create()`: `requestedBedId` is now `number | null` — passes `NULL` to the database for open requests.
- `resolve()`: accepts an optional `assignedBedId`. When provided, the UPDATE also sets `requested_bed_id` so accounting and downstream steps always have a target bed on record.

**Service (`RoomChangesService`)**

- `createRequest()`: bed validation (availability, gender lock, TR/foreigner, taken check) is skipped when no `requestedBedId` is supplied. Payment determination (count vs. threshold) runs regardless — it applies equally to open and specific requests.
- `resolve()` (staff approval):
  - Detects open requests via `request.requestedBedId == null`.
  - Raises `BadRequestException` if staff tries to approve an open request without providing `assignedBedId`.
  - Consolidates the two separate "bed taken" checks into one using `effectiveBedId` (either the stored bed or the staff-assigned one).
  - Passes `assignedBedId` through to the repository so it is persisted on the record.

**DTOs**

- `StudentCreateRoomChangeDto`: `requestedBedId` is now `@IsOptional()` — omitting it creates an open request.
- `ResolveRoomChangeDto`: added optional `assignedBedId: number` with `@IsOptional()` / `@IsInt()` — staff provides this when approving an open request.
