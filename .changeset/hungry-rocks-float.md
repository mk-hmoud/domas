---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"client": minor
"server": minor
"@domas/ui": minor
---

feat(room-types): add room type catalog — (infrastructure + management UI)

Introduces a `room_types` table that holds template-level display assets (gallery photos, description, amenities) shared across all physical rooms of the same type, avoiding per-room photo uploads.

**Database**

- New `room_types` table: `name`, `description`, `gallery_urls TEXT[]`, `amenities TEXT[]`
- `locations.room_type_id` FK (nullable, `ON DELETE SET NULL`)

**Server**

- `RoomTypesModule`: full CRUD at `GET/POST/PATCH/DELETE /room-types`
- Gated by `locations.view` (read) and `locations.update` (write)
- Locations `findAll` JOIN returns `roomTypeId` + `roomTypeName`; `update` accepts `roomTypeId`

**Shared packages**

- `ts-types`: `RoomType`, `CreateRoomTypeDto`, `UpdateRoomTypeDto` interfaces; `Location` + `UpdateLocationDto` extended with `roomTypeId`
- `api-client`: `roomTypes` endpoint object

**Management UI**

- `RoomTypeModal`: create/edit modal with name, description, amenity tags, URL-based gallery with inline previews
- `RoomTypesTable`: table with amenity badges and photo count
- `CreateLocationModal`: room type Select (shown for ROOM-type locations when `roomTypes` prop is provided)
- New `RoomTypesPage` at `/dashboard/room-types`
- Nav entry under Management (requires `locations.update`)
