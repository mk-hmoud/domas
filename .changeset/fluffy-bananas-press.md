---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

Client Dashboard — stats endpoint

Added a new `GET /stats/dashboard` endpoint that returns permission-scoped summary counts for the management dashboard.

- `@domas/ts-types`: added `DashboardStats`, `BookingStats`, `DamageStats`, `GuestStats`, `StudentStats`, `FinanceStats` interfaces
- `@domas/api-client`: added `stats.getDashboard()` helper
- `@domas/server`: new `StatsModule` / `StatsService` / `StatsController`; the service only queries sections for which the caller holds the required permission (`bookings.view`, `damages.view`, `guests.manage`, `students.view`, `bookings.approve_financial`)
