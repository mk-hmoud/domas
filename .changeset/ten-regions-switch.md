---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

Enhanced location context.

- **Location & Resident Context**:
  - Implemented `GET /locations/search` enhancement to optionally include full human-readable paths (e.g., "Campus > Block A > Room 101").
  - Added `GET /locations/:id/residents` to fetch all students with active bookings within a specific location hierarchy.
  - Developed `GET /inventory/active-mixed/:locationId` to provide a unified view of mandatory room inventory and personal student snapshots for targeted damage reporting.
  - Added `findActiveResidentsByLocation` to the students repository using PostgreSQL `ltree` optimized queries.

- **API & Type Updates**:
  - Updated `@domas/api-client` and `@domas/ts-types` to support location paths and the new resident/mixed-inventory endpoints.
