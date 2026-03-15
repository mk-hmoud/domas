---
"server": patch
---

Fixed inventory template retrieval and resolved bulk assignment database conflicts.

- **Data Retrieval:** Updated `findAllTemplates` to include full blueprint item details (IDs, catalog IDs, quantities, and localized names) in the initial fetch, eliminating the need for additional client-side joining.
- **Database Integrity:** Refactored the `ON CONFLICT` logic in `applyTemplate` to correctly match the database's partial unique indices for location and bed assignments. This resolves "no unique constraint matching" errors and ensures that duplicate items are updated gracefully instead of causing operation failures.
