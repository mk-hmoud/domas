---
"@domas/client-core": minor
"@domas/api-client": minor
"@domas/ts-types": minor
"client": minor
"@domas/ui": minor
---

Implemented UI and frontend logic for student check-in and access card management.

- **UI Components**:
  - Created `CheckInDetailsModal` for managing inventory snapshots and card issuance during check-in.
  - Developed `CardBatchModal`, `CardBatchTable`, and `AccessCardTable` for comprehensive card inventory management.
  - Added new localized strings for check-in and card system features in English and Turkish.

- **Pages & Routing**:
  - Implemented `CheckInPage` and `AccessCardsPage` in the main client.
  - Added shared page components in `client-core` for cross-app reusability.
  - Updated `DashboardLayout` and `App.tsx` navigation to include access card management.

- **Client & Types**:
  - Updated `Bookings` API client to support the enhanced check-in process.
  - Added DTOs for issuing and returning access cards.
