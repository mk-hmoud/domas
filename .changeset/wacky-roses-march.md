---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Rector role — backend foundation

- Add `RECTOR` constant to `SYSTEM_ROLES`
- Add `rector.view` permission constant
- Add `RectorDashboardStats` interface to `@domas/ts-types`
- Add `GET /stats/rector` endpoint guarded by `rector.view` permission
- Add `getRectorDashboard()` to `StatsService` with a single unified query (bookings, students, finances, damages, room changes)
- Add `stats.getRectorDashboard()` to `@domas/api-client`
- Seed Rector role and `rector.view` permission in `02_domain_schema.sql`
