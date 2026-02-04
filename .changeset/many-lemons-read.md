---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Undo System.

- **Core**: =Undo/Redo logging with granular permissions.
- **Students/Users**: Undo support for Deletion (Restore) and Update (Whitelist protected).
- **Access Control**: Undo support for Role Assignment and Revocation.
- **Semesters**: Undo support for Create, Delete, Status Update, and Modification (Whitelist protected).
- **Bookings**: Undo support for Create, Cancel, Check-In, Financial Approval, Rejection, and Modification.
- **Permissions**: Added `undo.own` and `undo.all` (restricted) permissions.
- **Client**: Added `getRecentUndos` and `undo` endpoints to `@domas/api-client`.
