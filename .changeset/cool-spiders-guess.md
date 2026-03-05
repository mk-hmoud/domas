---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Implemented a atomic Excel Import system for students and bookings
Backend Changes:

- **Atomic Bulk Import:** New `ImportsModule` that handles multipart Excel uploads. Processing is wrapped in a single database transaction to ensure data
  integrity; any row failure triggers a full rollback.
- **Dry-Run Validation:** Implemented a "Backend-Heavy" validation logic that detects both database conflicts and internal file conflicts (e.g., duplicate
  student numbers or overlapping bed assignments within the same Excel).
- **Master Undo Log:** Replaced row-by-row logging with a single Master Undo Log. Undoing a batch atomically reverts all created records and cleans up room
  gender locks in two efficient queries.
- **Financial Safety:** Added a safety bridge that blocks the "Undo" operation if any student in the batch has already made a payment or has active financial
  records.
- **Repository Pattern:** Refactored database logic into a new `ImportsRepository` and added performance-optimized occupancy checks to `BookingsRepository`.
- **Infrastructure:** Updated the database schema with the `import_batches` table, including full audit triggers and traceability notes.
