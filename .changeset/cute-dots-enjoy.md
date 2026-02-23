---
"@domas/client-core": minor
"@domas/ts-types": minor
"server": minor
"@domas/ui": minor
---

- **Location & Bed Registries**:
  - Separated the Location Registry into dedicated **Locations** and **Beds** tabs for better data management.
  - Implemented rich server-side filtering for both registries, including policies (Gender, TR-Only, Guest Zone) and occupancy status.
  - Enhanced the Bed Registry to show **Current Resident Names** and full **Location Paths** (e.g., Building > Floor > Room).
  - Implemented **Hierarchical Searching** for beds: search by bed label, room name, or parent building/floor name.
- **Dormitory Operations**:
  - Fixed a state desync issue where beds were not correctly marked as 'Occupied' upon student check-in.
  - Improved the **Undo** system to properly revert physical bed statuses when a check-in or check-out is reversed.
  - Added support for editing individual beds via a new modal integrated into the Registry view.
- **Internationalization**:
  - Added full Turkish and English support for all new Registry labels, filters, and columns.
- **Technical Fixes**:
  - Resolved a compiler "Debug Failure" by refactoring the `LocationsRepository`.
  - Updated all internal server imports to use relative paths for better development consistency.
