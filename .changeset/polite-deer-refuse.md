---
"server": minor
---

Integrated undo functionality for the Access Card management system.

Key features include:

- **Card Lifecycle Reversion**: Implemented specific undo handlers for creating card batches, issuing cards, and returning cards. Reversing a batch creation performs a clean cascade delete, while reversing issuance or returns accurately restores the previous card state (holder, booking association, and status).
- **Audit Trail Integrity**: Added a new `reversed` action type to physical card logs. Undoing a card action now automatically inserts a reversal record into the card's history, ensuring a transparent audit trail of physical asset movements even when administrative errors are corrected.
- **Atomic Check-in Undo**: Enhanced the booking check-in undo logic to automatically identify and revert any access cards that were assigned as part of the student arrival workflow.
- **Type Safety**: Updated the central `UndoActionType` and `CardActionType` enums to support the new operations.
