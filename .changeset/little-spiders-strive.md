---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Implemented a comprehensive Inventory Damage Reporting and Liability system.

- **Database & Schema**:
  - Added support for tracking specific culprits via `culprit_ids` (UUID array).

- **Server-side Logic**:
  - Implemented a robust "Staff Report → Manager Approve" workflow.
  - Developed logic to automatically split damage costs among students based on location hierarchy or specific targeting.
  - Integrated dual-currency pricing logic: Turkish students are charged in `TRY`, while international students are charged in the semester's foreign currency.
  - Automated financial transaction (fine) creation upon manager approval, with immediate approval status.
  - Added validation to ensure all reported culprits have active bookings at the incident location.

- **Shared Types & Client**:
  - Defined `DamageStatus` enum and `DamageReport`/`DamageLiability` interfaces in `@domas/ts-types`.
  - Created DTOs for reporting and reviewing damages.
  - Expanded `@domas/api-client` with a new `damages` endpoint for frontend integration.
