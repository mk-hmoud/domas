---
"@domas/client-core": minor
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
"@domas/ui": minor
---

server:

- Added `POST /locations/room-with-beds` and `POST /locations/bulk-room-with-beds`.
- Automatically creates specified number of beds when creating a room.
- Updated API client and DTOs.

client:

- Added view selected locations drawer to bulk operations bar.
- Improved creation modal to show the appropriate type of location that can be created according to the parent type.
