---
"@domas/api-client": minor
"@domas/ts-types": minor
---

Room catalog: shared package types and api-client methods for building/catalog discovery.

- `RoomType` interface gains `capacity: number`; `CreateRoomTypeDto` / `UpdateRoomTypeDto` gain optional `capacity`
- `AvailableBed` gains optional `roomTypeId`
- New `PortalBuilding` interface: `{ id, name, availableBedCount }`
- New `RoomTypeCatalogItem` interface: room type fields + `availableBedCount`, `minPrice`, `maxPrice`
- `portalSemesters.getAvailableBeds` accepts optional `roomTypeId` filter
- `portalSemesters.getBuildings(semesterId)` — fetch buildings with available beds
- `portalSemesters.getRoomCatalog(semesterId, { buildingId?, capacity? })` — fetch room type catalog
