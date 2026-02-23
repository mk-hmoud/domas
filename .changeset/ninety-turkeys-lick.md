---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

Enhanced the locations registry with advanced filtering and real-time occupancy data.

- **Types & DTOs:** Created `FindAllLocationsDto` to support filtering by type, gender lock, TR-only, guest zone, ownership, and parent hierarchy.
- **Backend Enhancements:**
  - Updated `LocationsRepository.findAll` to include hierarchical occupancy data (total beds vs. occupied beds) using optimized subqueries.
  - Implemented logic to filter locations based on occupancy (e.g., finding only rooms with available beds).
  - Supported hierarchical filtering to easily view all direct children of a specific location.
- **API Client:** Updated `@domas/api-client` to expose these rich filtering capabilities and correctly handle the occupancy data in the return types.
