---
"@domas/client-core": patch
"@domas/ui": patch
---

packages/ui — CreateLocationModal

- Reset autoCreateBeds and bedCount to defaults whenever the modal opens, so stale state from a previous room creation can't carry over to a subsequent non-room
  creation.

packages/client-core — SharedLocationsPage

- Single create: createRoomWithBeds is now only called when dto.type === LocationType.ROOM. Any other type (building, floor, block, etc.) falls through to the regular
  create endpoint regardless of the createBedsCount argument.
- Bulk create: same guard — createRoomsWithBedsMany is only used when every location in the batch is of type ROOM.
