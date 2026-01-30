---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

Feature: Bulk operations for Students.

- Added `POST /students/bulk-delete` and `PATCH /students/bulk-status`.
- Updated API client with `deleteMany` and `updateStatusMany`.
- Added shared DTOs for bulk operations.
