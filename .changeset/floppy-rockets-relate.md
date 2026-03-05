---
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Implemented a Semester Rollover (Transfer) lifecycle for continuous student residency without manual check-in intervention.

Key changes:

- Added `CONFIRMED` and `TRANSFERRED` statuses to the booking lifecycle.
- Modified the financial approval process to move renewal bookings directly to `CONFIRMED` instead of `READY_FOR_CHECKIN`.
- Added an atomic "Rollover Flip" logic that transitions old bookings to `TRANSFERRED` and new ones to `ACTIVE` simultaneously when a semester boundaries are crossed.
- Implemented automatic access card re-linking during transfers to ensure student keys continue working across semesters without re-issuance.
- Added a nightly Cron job to automate the activation of confirmed renewals.
