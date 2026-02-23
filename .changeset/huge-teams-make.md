---
"@domas/api-client": minor
"server": minor
---

Implemented automated bed eligibility filtering and improved dynamic gender locking.

- **Bed Eligibility:** Added a specialized endpoint (`GET /beds/eligible`) to filter available beds based on student gender and nationality constraints (Gender Lock and TR-only).
- **Improved Dynamic Gender Lock:**
  - Gender is now automatically locked to a room upon **Booking Creation** (preventing mixed-gender reservations before check-in).
  - Gender lock is automatically released upon **Check-Out** or **Undo**, but only if the room has no remaining occupants AND no other active/upcoming reservations.
- **Repository Support:** Implemented `countActiveByRoom` in `BookingsRepository` and enhanced `clearGenderLockIfEmpty` in `LocationsRepository` to accurately track room availability.
- **API Client:** Updated `@domas/api-client` to support fetching eligible beds.
