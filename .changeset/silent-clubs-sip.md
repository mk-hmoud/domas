---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Transitioned the damages system to a "Current Replacement Cost" model and enhanced validation.

- **Inventory Snapshots**:
  - Simplified `booking_inventory_snapshots` by removing fixed pricing columns. Damage costs are now dynamically fetched from the master catalog at the time of incident approval to account for inflation and maintain pricing fairness.
- **Damage Reports**:
  - Added support for direct `catalog_id` links in damage reports, allowing staff to report damages on items not specifically captured in a room snapshot.
  - Implemented `culprit_ids` (UUID array) to allow charging multiple specific students for a single incident.
  - Added `manual_cost_foreign` and `manual_currency_code` to support explicit international pricing for structural damages (e.g., wall paint).
- **Validation & Integrity**:
  - Added a database `CHECK` constraint to ensure every damage report has a valid pricing source (either an inventory link or a complete set of manual prices).
  - Implemented conditional DTO validation using `@ValidateIf` to enforce manual price requirements only when no inventory item is selected.
  - Standardized numeric handling across the service layer to prevent type coercion errors.
- **Workflow**:
  - Streamlined the approval process by automatically approving financial transactions when a manager approves a damage report.
