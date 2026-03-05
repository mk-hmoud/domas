---
"client": minor
"@domas/client-core": minor
"@domas/ui": minor
---

Implemented a new "Booking Transfers" UI that enables managers to perform bulk rollovers of student bookings across semesters.

Key changes:

- Created a `TransfersPage` with multi-select support for active student bookings.
- Integrated a new `TransferSemesterModal` for configuring target semesters and optional date adjustments.
- Added support for bulk operations, allowing many students to be renewed into a new semester in a single action.
- Re-used existing backend bulk-transfer endpoints for consistency and data safety.
