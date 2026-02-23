---
"server": minor
---

Enhanced the locations and beds registries with advanced filtering and real-time occupancy data.

- **Types & DTOs:**
  - Created `FindAllLocationsDto` to support filtering locations by type, gender lock, TR-only, guest zone, ownership, and parent hierarchy.
  - Updated `FindAllBedsDto` to support filtering beds by location, status, gender lock, TR-only, guest zone, and ownership.
- **Backend Enhancements:**
  - Updated `LocationsRepository.findAll` to include hierarchical occupancy data (total beds vs. occupied beds) using optimized subqueries.
  - Implemented rich filtering in `BedsRepository.findAll` to allow precise bed searching across multiple criteria (status, nationality, gender, etc.).
- **API Client:** Updated `@domas/api-client` to expose these rich filtering capabilities for both locations and beds.
