---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

Rector role — rector beds/residents backend

- Relax rectorate booking restriction: users with `rector.view` permission can now book rectorate-owned beds (previously Recovery Admin only); uses `context.permissions` so no extra DB query
- New `RectorModule` with `GET /rector/beds` and `GET /rector/residents` endpoints, both guarded by `rector.view`
- `GET /rector/beds` returns all rectorate-owned beds with status, location path, current resident name, and aggregate counts (total / available / occupied)
- `GET /rector/residents` returns all active bookings in rectorate-owned beds with student info, location, and dates
- Add `RectorBed`, `RectorBedsResponse`, `RectorResident` interfaces to `@domas/ts-types`
- Add `rector.getBeds()` and `rector.getResidents()` to `@domas/api-client`
