---
"@domas/database": minor
"server": minor
---

Feature: Soft Delete support.

- Updated database schema to include `deleted_at` column for Users, Students, Locations, and Beds.
- Implemented soft delete logic (hide on read, timestamp on delete) in repositories.
- Replaced UNIQUE constraints with partial indexes for `users.email` and `students.student_number` to allow duplicates for soft-deleted records.
