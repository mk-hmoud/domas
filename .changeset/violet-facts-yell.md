---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Implemented Enterprise Inventory Templates (Blueprints) to streamline bulk inventory management with high-performance execution and robust data integrity.

- **Database:** Added `inventory_templates` and `inventory_template_items` with modern `GENERATED ALWAYS AS IDENTITY` keys, soft-deletion support, and `UNIQUE` item constraints.
- **Blueprint Scoping:** Templates now have an explicit `scope` ('bed', 'room', 'shared'), preventing the accidental assignment of room-level items to individual beds.
- **Bulk Application:**
  - **High-Performance:** Refactored `applyTemplate` to use single-query bulk inserts, reducing database roundtrips by 99% for large operations.
  - **Data Integrity:** Implemented `ON CONFLICT DO UPDATE` handling for duplicate assignments and pre-transaction existence validation for all targets.
  - **Replace Mode:** Option to wipe existing inventory before applying the new blueprint.
- **Audit Trail:**
  - Integrated with the Undo system and added `createdBy` tracking for all templates.
  - **Granular Reversibility:** Added dedicated undo handlers for updating and deleting templates.
  - **Precision Bulk Undo:** Implemented logic to completely reverse a bulk template application (including restoring previously deleted items) in a single undo action.
- **Shared Types & Client:** Updated `@domas/ts-types` and `@domas/api-client` with full support for scoped templates and optimized bulk application.
