---
"@domas/client-core": minor
"@domas/ui": minor
---

Refactored Semesters UI with smart pre-filling, dynamic academic years, and enhanced status workflow.

- Updated `SemesterModal` with dynamic academic year generation and smart pre-filling logic.
- Replaced basic text inputs with strict `Select` and `DatePickerInput` components for better data integrity.
- Implemented business logic for locking fields based on semester status.
- Updated `SharedSemestersPage` to support new status actions (Set Active, Close, Archive).
- Added localization support for all new fields and statuses.
