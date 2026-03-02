---
"@domas/client-core": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
"@domas/ui": minor
---

Completely removed automatic semester closing in favor of a safer, manual "Safe Close" process.

- **Feature Removal:** Eliminated the `auto_close` field from the entire stack (Database, Server Entities, Repositories, DTOs, and UI).
- **Safe Close Logic:** Implemented a server-side check that prevents a semester from being closed if any students are still checked-in or awaiting check-in. This ensures every student stay is properly resolved or transferred before finalization.
- **Improved Data Integrity:** Managers are now forced to resolve active student stays before a semester can be archived, preventing "ghost" occupancies and accounting errors.
- **UI Cleanup:** Removed the `auto_close` toggle and status badges from the Semester management views.
