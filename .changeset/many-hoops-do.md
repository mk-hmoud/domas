---
"@domas/ts-types": minor
"server": minor
---

ts-types: remove basePrice from location types, make capacity required on room type.

- `Location` interface: `basePrice` removed
- `UpdateLocationDto`: `basePrice` removed
- `CreateLocationDto`: `basePrice` removed, `roomTypeId` added
- `RoomType`: `capacity: number` (was already present)
- `CreateRoomTypeDto`: `capacity` is now required (not optional)

server: schema enforcement, remove base_price, add semester pricing table.

**Schema:**

- `room_types.capacity` is now NOT NULL with no default — must be explicitly provided
- `locations.base_price` column removed — pricing is now exclusively handled via semester pricing
- `locations.room_type_id` FK changed to ON DELETE RESTRICT (can't delete a room type in use)
- New check constraint `room_requires_type`: a location of type `room` must have a `room_type_id`
- New `semester_room_pricing(semester_id, room_type_id, price_try, price_foreign)` junction table

**Room types:**

- `capacity` is now required (no default) in `CreateRoomTypeDto` and the repository INSERT

**Locations:**

- `base_price` removed from entity, create/update DTOs, repository (selectColumns, create, update, updateMany, findAll)
- `roomTypeId` added to `create` INSERT (was only settable via update before)
- `CreateLocationDto` now requires `roomTypeId` when `type === 'room'` via `@ValidateIf`
- `LocationsService.create` throws `BadRequestException` if `type === 'room'` and no `roomTypeId` provided
