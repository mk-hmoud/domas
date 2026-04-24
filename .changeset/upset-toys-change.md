---
"client": minor
"@domas/ui": minor
---

Rector role — rector portal pages (beds/residents/new booking)

- Update `RectorLayout` nav: Occupancy/Finances/Issues → Beds/Residents/New Booking
- `RectorOverviewPage` — 3 stat cards (total/occupied/available) + recent residents list
- `RectorBedsPage` — full list of rector-owned beds with status badge and current resident name
- `RectorResidentsPage` — all active bookings in rector beds: student, bed, location, dates, status
- `RectorNewBookingPage` — mobile-friendly form: student search, available rector bed picker, open semester picker; submits to existing `POST /bookings`
- Update `App.tsx` routes: beds/residents/new-booking replace occupancy/finances/issues
- Add i18n keys for new pages (EN + TR)
