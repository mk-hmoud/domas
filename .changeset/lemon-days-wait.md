---
"server": minor
---

Portal catalog enforcement: semester pricing

- `findBuildings`: CTE now INNER JOINs `room_types` and `semester_room_pricing` so only
  buildings with typed+priced available beds are returned
- `findRoomCatalog`: removed stale `l.base_price` reference; CTE uses INNER JOINs for
  enforcement; result now includes `priceTry`/`priceForeign` from `semester_room_pricing`
  instead of `minPrice`/`maxPrice` aggregates
- `findBedWithRoom`: now selects `l.room_type_id` and exposes it as `room.roomTypeId`
- `hasSemesterPricing(semesterId, roomTypeId, client)`: new method for booking enforcement
- `createBooking` service: added step 5 — rejects if room has no room type or if the room
  type has no price set for the selected semester
