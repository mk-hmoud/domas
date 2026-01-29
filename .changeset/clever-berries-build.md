---
"@domas/client-core": minor
"client": minor
"@domas/ui": minor
---

Added Students management UI components and shared page.

- Created `StudentModal` in `@domas/ui` for creating and editing students, supporting new fields like National ID and Birth Date.
- Implemented `SharedStudentsPage` in `@domas/client-core` with server-side search, pagination, and a slide-out drawer for student details.
- Enhanced phone number input to allow flexible formatting (spaces) while ensuring clean data submission.
- Added full localization for student management in both English and Turkish.
