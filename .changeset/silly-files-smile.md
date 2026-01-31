---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Enhanced API for Location Management.

- **Bulk Operations**: Added endpoints for bulk updating `genderLock`, `isGuestZone`, `isTrOnly`, and `ownership`.
- **Logic**: Enforced cascading updates (write inheritance) for these policies with optional `cascade` flag.
- **Refactor**: Separated specific policy updates from generic location updates for cleaner API and stricter control.
- **Schema**: Removed `capacity` from `locations` table.
