---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

overhaul of the Semesters module and lifecycle

- database
  - Introduced semester_status_enum for advanced lifecycle tracking: planned, open, active, closed, and archived.
  - Introduced semester_type_enum supporting fall, spring, and summer terms.
  - Added academic_year and display_name columns for structured term identification.
  - Implemented a Financial Configuration layer: deposit_amount_try, deposit_amount_foreign, and foreign_currency_code.
  - Added Booking Windows (booking_start_date, booking_end_date) to configure student portal availability independently from living dates.
  - Implemented Automation Flags (auto_activate, auto_close) for future scheduled task integration.
  - Enforced Strict Data Integrity via a unique constraint on (academic_year, type) and a partial unique index ensuring only one active semester exists at any
    time.

- server
  - State Machine Validation: Implemented a strict transition matrix (e.g., CLOSED cannot move back to OPEN).
  - Field-Level Locking:
    - Identity Lock: type and academic_year are immutable once a semester moves beyond the PLANNED state.
    - Financial Lock: Deposits are locked if the semester is ACTIVE/CLOSED, or if it is OPEN and has existing student bookings.
    - Date Lock: start_date is immutable for ACTIVE semesters.
  - Orphan Protection: The delete operation is now forbidden if any bookings (active or pending) are linked to the semester.
  - Automated Display Logic: The server now automatically generates and persists formatted display names (e.g., "2024-2025 Fall").

- api-client & ts-types
  - Refactored findAll to support Pagination via FindAllSemestersDto.
  - Added updateStatus endpoint to handle explicit lifecycle transitions.
  - Synchronized all new enums, interfaces, and DTOs across @domas/ts-types.
  - Updated @domas/api-client with full CRUD and status management methods.
  - Resolved cross-module dependencies between SemestersModule and BookingsModule.
