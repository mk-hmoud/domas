---
"@domas/client-core": minor
---

Open room change requests: admin UI bed picker in the approve drawer.

**`SharedRoomChangesPage` (`@domas/client-core`)**

- The review drawer now detects open requests (`requestedBedId == null`) and shows a searchable bed `Select` populated from `getAvailableBeds(bookingId)`.
- The **Approve** button is disabled until a bed is chosen for open requests.
- `assignedBedId` is passed to `roomChanges.resolve()` when approving an open request so the server can persist the assignment and move the bed.
- The card list and drawer detail both display `"Open request"` (i18n key `room_change.open_request`) in place of bed/location labels when no specific bed was requested.
- Available beds are fetched lazily when the drawer opens for an open request; state is cleared on close.

**No API client changes were required** — `resolve()` already forwards the full DTO object, and `ResolveRoomChangeDto` was updated in batch 1 to include the optional `assignedBedId` field.
