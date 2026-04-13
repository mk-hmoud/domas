---
"client": minor
"@domas/ui": minor
---

Dashboard — stat cards UI

Implemented the management client dashboard page with permission-scoped stat widgets.

- `@domas/ui`: new `StatCard` component — displays a labelled count with an icon, colour, optional suffix text, and a loading skeleton state
- `@domas/client`: `DashboardHome` page rewritten; fetches `/stats/dashboard` on mount and renders section groups (`Bookings`, `Damages`, `Guest Stays`, `Students`, `Finances`) — each section is only rendered when the user holds the required permission; users with no matching permissions see a plain welcome message
- i18n: added `dashboard.stat_*` and `dashboard.section_*` keys to both `en` and `tr` locales
