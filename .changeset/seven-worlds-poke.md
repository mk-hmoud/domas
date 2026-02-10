---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Refactored the inventory system.

- **Inventory System Pivot**:
  - Simplified the design by removing room-specific "extra" assignments.
  - Updated the check-in process to accept `selectedExtraCatalogIds`, allowing students to opt-in to global rental items.
  - Refactored `InventoryService` and `InventoryRepository` to merge mandatory room-assigned items with selected global optional items during snapshot generation.

- **API & DTOs**:
  - Simplified the `getAvailableExtras` API to be a global fetch.
  - Updated `CheckInBookingDto` to use integer-based catalog IDs for extra selections.
