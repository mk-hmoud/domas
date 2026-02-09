---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Implemented opt-in inventory extras.

- **Database**:
  - Added `is_extra` to `inventory_assignments`.

- **Server**:
  - Refactored `InventoryService` to strictly use `InventoryRepository`, moving all raw SQL out of the service layer.
  - Updated check-in logic to support manual selection of "extra" inventory items via `CheckInBookingDto`.

- **Shared Packages & Client**:
  - Updated `@domas/ts-types` with new inventory flags, interfaces, and DTOs.
  - Enhanced `@domas/api-client` to support the new check-in parameters and provide access to available inventory extras.
