---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Transitioned to a semester-centric booking model and mplemented a dedicated endpoint for adjusting booking dates.

- **Database:**
  - Modified `bookings` table to make `semester_id` NOT NULL.
  - Added `previous_booking_id` to `bookings` to support renewals and semester transfers.
  - Removed strict `validate_booking_dates` trigger and function to allow for "Soft Boundaries" (overriding dates outside the standard semester range).
- **Backend:**
  - Updated `BookingsService.create` to automatically pull default `startDate` and `endDate` from the selected semester if not explicitly provided.
  - Enhanced `BookingsRepository` to handle the new `previous_booking_id` field and fixed syntax errors in creation queries.
  - Implemented strict validation in `BookingsService.update`:
    - `startDate` is locked once a booking is `active` (checked-in) or finalized.
    - `endDate` is locked only once a booking is finalized (checked-out, cancelled, or rejected), allowing for extensions or early move-outs during the stay.
  - Added sanity checks to ensure `startDate` is always before `endDate` during creation and updates.
- **Types:**
  - Added `previousBookingId` to the shared `Booking` interface.
  - Updated `CreateBookingDto` to make `startDate` and `endDate` optional and include `previousBookingId`.

- **Dedicated Endpoint:** Added `PATCH /bookings/:id/dates` to allow explicit date modifications separate from general booking updates.
- **Business Rule Enforcement:**
  - Locked `startDate` modifications once a booking is active or finalized.
  - Allowed `endDate` adjustments until a booking is finalized (checked out, cancelled, or rejected).
  - Enforced that `startDate` must precede or equal `endDate`.
