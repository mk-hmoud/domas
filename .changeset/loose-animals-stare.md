---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

ts-types, api-client: semester room pricing types and api-client methods.

- New `SemesterRoomPricingRow`, `SemesterRoomPricingItemDto`, `SetSemesterPricingDto` interfaces in `semester.interface.ts`
- `semesters.getPricing(id)` — fetches all room types with their price for a semester
- `semesters.setPricing(id, dto)` — bulk upserts the pricing matrix for a semester

server: semester room pricing endpoints in SemestersModule.

- New `SetSemesterPricingDto` with `items: [{ roomTypeId, priceTry, priceForeign? }]`
- `SemestersRepository.findPricing(semesterId)`: returns all room types with their price for this semester (null when not yet set)
- `SemestersRepository.upsertPricing(semesterId, items)`: bulk upsert — removes rows not in the payload, inserts/updates the rest
- `SemestersService.getPricing / setPricing`
- `GET /semesters/:id/pricing` — requires `SEMESTERS_VIEW`
- `PUT /semesters/:id/pricing` — requires `SEMESTERS_MANAGE`
