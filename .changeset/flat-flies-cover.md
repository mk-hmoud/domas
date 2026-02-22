---
"server": minor
---

Consolidated multiple undo logs into single entries for key business operations to improve the user experience and maintain data integrity.

- **Check-In/Check-Out:** Added a `skipUndo` flag to `AccessCardsService` methods (`issueCard`, `returnCard`) to prevent redundant undo logs when these operations are part of a booking check-in or check-out.
- **Damage Reports:** Updated `DamagesService` to suppress the `APPROVE_DAMAGE_REPORT` undo log when a report is created with `autoApprove: true`, ensuring only a single high-level log is registered.
- **Undo Strategy:** Streamlined the "Latest Undos" list by ensuring that logically atomic actions (like checking in a student) only generate one undoable entry that handles all necessary reversions.
