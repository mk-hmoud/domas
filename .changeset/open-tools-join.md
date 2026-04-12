---
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Guest stays — database schema, types, and server module.

**Database** (`02_domain_schema.sql`, `01_infrastructure.sql`)

- New `guest_stay_status` enum: `confirmed | active | completed | cancelled`.
- New `guests` table: `first_name`, `last_name`, `id_number` (passport/national ID), `email`, `phone`, `notes`.
- New `guest_stays` table: links a guest to a bed for a date range; `payment_required` flag with `amount_due / amount_paid / currency` fields; `status` lifecycle; `actual_check_in / actual_check_out` timestamps; GIST exclusion constraint prevents overlapping stays on the same bed (consistent with the existing bookings constraint).
- `damage_reports.culprit_guest_stay_ids UUID[]` — allows guest stays to be named as culprits on a damage report alongside students.
- `damage_liabilities.guest_stay_id UUID` — alternative to `student_id`; a CHECK constraint enforces exactly one of the two must be set (student or guest, never both).
- `damage_liabilities.student_id` `NOT NULL` constraint relaxed to allow guest-only liabilities.

**`@domas/ts-types`**

- `GuestStayStatus` enum.
- `Guest` and `GuestStay` interfaces (with embedded `guest` snapshot, bed/room/location path, and `createdByName`).
- `CreateGuestDto`, `UpdateGuestDto`, `CreateGuestStayDto`, `UpdateGuestStayDto`, `FindGuestStaysDto`.
- `DamageReport.culpritGuestStayIds` added; `DamageLiability.studentId` made optional and `guestStayId` added.

**Server — `GuestsModule`**

- `GuestsRepository`: CRUD + name/ID-number search for reusing existing guest records.
- `GuestStaysRepository`: full lifecycle (`create`, `findAll` with status/upcoming/bed filters, `findById`, `update`, `checkIn`, `checkOut`, `cancel`); JOIN-enriched results include guest info, bed label, room name, location path, and creator name.
- `GuestsService`: validation (guest exists, date order, status transitions).
- `GuestsController`: all endpoints under `guests.manage` permission.
  - `GET/POST /guests`, `PATCH /guests/:id`, `GET /guests/by-id-number/:idNumber`
  - `GET/POST /guest-stays`, `GET/PATCH /guest-stays/:id`
  - `POST /guest-stays/:id/check-in|check-out|cancel`
- `GUESTS_MANAGE = 'guests.manage'` added to permissions constants.
- Module exported from `AppModule`.

**Server — damages integration**

- `CreateDamageReportDto` accepts `culpritGuestStayIds`.
- Service validates guest stay IDs on report creation (must be `confirmed` or `active`).
- `processApproval` creates `damage_liabilities` rows for guest culprits (split cost equally across all student + guest culprits; guest liabilities always use TRY).
- `findLiabilitiesByReport` now JOINs guest stays + guests to return `guestName`, `guestStayCheckIn`, and `guestStayCheckOut` alongside student info.
