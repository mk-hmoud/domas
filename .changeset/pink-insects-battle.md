---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Implemented "Foreigner Only" constraint for locations and beds to support flexible housing policies.

- **Database:** Added `is_foreigner_only` column to `locations` and `beds` tables.
- **Business Logic:**
  - Enforced "Foreigner Only" policy: Turkish students are now prevented from booking rooms or beds marked as foreigner-only.
  - Enhanced bed eligibility filtering to correctly handle the new constraint alongside existing TR-only rules.
- **Management API:**
  - Added dedicated endpoints for single and bulk updates of the `isForeignerOnly` flag for both locations and beds.
  - Fully integrated the new policy into the Undo system, supporting cascading reversions.
- **Shared Types:** Updated `Location` and `Bed` interfaces and created corresponding DTOs in `@domas/ts-types`.
- **Client Support:** Updated `@domas/api-client` to expose the new update methods.
