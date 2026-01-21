---
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

implement location restrictions and quota ownership

- database
  - Introduced location_ownership_type ENUM supporting dorm and rectorate values.
  - Added is_tr_only flag to reserve locations for Turkish citizens.
  - Added ownership column to track inventory allocation (e.g., Rectorate quotas).

- server: Constraint Logic (`BookingsService`)
  - Inheritance System: Both is_tr_only and ownership properties now follow a hierarchical inheritance model. A restriction applied to a Block or Floor automatically
    applies to all Rooms and Beds beneath it.
  - Nationality Enforcement: The system now blocks booking attempts if a student's nationality does not match a location's "TR Only" restriction.
  - Role-Based Quotas: Rectorate-owned locations are now protected; only users with the ADMIN role can book students into these reserved spots. Though is temporary.
  - Repositories: Updated LocationsRepository and BedsRepository to support new metadata and exports.

- ts-types
  - Types & API: Synchronized all new enums (LocationOwnership) and interfaces across the shared packages.
