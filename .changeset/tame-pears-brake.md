---
"@domas/ts-types": minor
"server": patch
---

Add navbar counter data to dashboard stats.

Extend `FinanceStats` with `pendingAccounting` (bookings in `pending_accounting` status, distinct from `pendingPayments`). Add `RoomChangeStats` interface and `roomChanges` field to `DashboardStats`. Update `StatsService` to populate both fields, gated by the appropriate permissions (`bookings.approve_financial` and `room_changes.view`).
