---
"server": minor
---

Core portal endpoints (semesters, bookings, financial)

Adds `StudentPortalRepository` (direct SQL, no circular module dependencies) and expands `StudentPortalService` with all booking-related operations.

**New endpoints (all require student session):**

Semesters:

- `GET /portal/semesters` — list semesters with status `open` or `active`
- `GET /portal/semesters/:id/available-beds` — available beds pre-filtered by student nationality and gender constraints

Bookings:

- `GET /portal/bookings` — all bookings for the authenticated student (with room and semester info)
- `GET /portal/bookings/current` — most recent non-terminal booking (includes access card number)
- `GET /portal/bookings/:id` — detailed view of one booking (must belong to student)
- `POST /portal/bookings` — submit a booking request; validates semester window, duplicate detection, bed constraints (TR-only, foreigner-only, gender lock, rectorate), and locks room gender on first booking

Financial:

- `GET /portal/transactions` — student's payment transaction history
- `GET /portal/damages` — student's damage liabilities with linked report info

**Booking creation rules enforced by the portal:**

- Semester must be `open` or `active` and within its booking window dates
- Only one active booking per semester per student
- Bed must be `available`, non-guest-zone, non-rectorate
- Nationality and gender constraints validated before insert
- Room gender is locked after first booking (same logic as admin booking flow)
