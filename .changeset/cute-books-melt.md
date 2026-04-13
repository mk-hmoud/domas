---
"@domas/ts-types": minor
"client": minor
"server": minor
"@domas/ui": minor
---

**Dashboard — quick-action panels**

Added enriched pending-item lists to the dashboard so staff can act without navigating away.

- `@domas/ts-types`: added `PendingBookingRow` and `PendingDamageRow` interfaces; extended `DashboardStats` with `pendingBookings` and `pendingDamages` optional arrays
- `@domas/server`: `StatsService.getDashboard()` now also queries the top-5 oldest pending bookings (JOIN to students + locations) and top-5 oldest pending damage reports (JOIN to locations) when the caller holds `bookings.view` / `damages.view` respectively
- `@domas/client`: `DashboardHome` renders a compact table beneath the booking stat cards (pending financial approval, links to `/bookings`) and beneath the damages stat card (pending reports, links to `/damages`); tables are only shown when there is at least one row
- i18n: added `dashboard.pending_bookings_list` and `dashboard.pending_damages_list` keys in `en` and `tr`
