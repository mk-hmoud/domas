---
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Implemented auditing and added updated at for tables in inventory module.

- Added `updated_at` columns and automated triggers for `inventory_catalog`, `inventory_assignments`, and `booking_inventory_snapshots`.
- Applied audit log triggers to track data changes across all inventory tables.
- Updated TypeScript interfaces and server-side entities to include `updatedAt` timestamps.
- Refactored `InventoryRepository` to support the new timestamp fields.
- Enhanced `UndoService` with standardized `updated_at` handling for inventory-related reversions.
- Edited inventory service to wrap the methods in db.transaction.
