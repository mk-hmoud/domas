---
"server": minor
---

Room catalog: add capacity to room types and new portal discovery endpoints.

- `room_types` table and `RoomType` entity gain a `capacity` field (SMALLINT 1–8, default 1)
- `RoomTypesRepository.create/update` persist capacity
- `StudentPortalRepository.findAvailableBedsForSemester` accepts optional `roomTypeId` filter and now returns `roomTypeId` on each bed row
- New `StudentPortalRepository.findBuildings`: returns buildings with available-bed counts for the student's semester/profile
- New `StudentPortalRepository.findRoomCatalog`: returns room types with available-bed counts and price range, filterable by building and capacity
- New portal endpoints:
  - `GET /portal/semesters/:id/buildings`
  - `GET /portal/semesters/:id/room-catalog?buildingId=N&capacity=N`
  - `GET /portal/semesters/:id/available-beds?roomTypeId=N` (roomTypeId now accepted)
