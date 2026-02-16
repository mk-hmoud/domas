---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

Implemented student checkout process and enhanced transaction safety for card management.

- **Booking Checkout**:
  - Added `POST /bookings/:id/check-out` endpoint to handle student departures.
  - Automates status transitions, card returns, and bed availability updates.
  - Fully integrated with the Undo system, allowing checkouts to be reversed (including card re-activation).
- **Transaction Safety**:
  - Refactored `AccessCardsService` to support external database clients, ensuring card operations (issue/return) are atomic with booking transactions.
  - Standardized `UndoActionType` enums across packages.
- **Inventory API**:
  - Exposed simplified global extras and mixed inventory endpoints to support the checkout and damage reporting UI.
