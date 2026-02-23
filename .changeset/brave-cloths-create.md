---
"server": minor
---

Implemented the "Explicit State" architectural paradigm for locations and beds, and fully integrated the undo system for these domains.

- **Explicit State Paradigm:**
  - Removed hierarchical inheritance for rules (TR-only, Guest Zone, Ownership).
  - Updated `LocationsService.create` and `BedsService.create` to automatically copy state flags from parents at creation time, allowing for O(1) rule evaluation.
  - Ensured that explicit overrides provided during creation are respected and prioritized over inherited defaults.
- **Improved Cascading Operations:**
  - Enhanced `LocationsRepository` to explicitly propagate policy changes (TR-only, Guest Zone, Ownership) down to all child locations and their associated beds during cascading updates.
- **Full Undo Integration:**
  - Integrated `UndoService` across `LocationsService` and `BedsService` for all Create, Update, Delete, and Policy operations.
  - Implemented cascading reversions in `UndoService`: undoing a bulk policy update now correctly and explicitly restores the previous state for the entire affected hierarchy, including child locations and beds.
  - Added support for bed-specific policy undos (`UPDATE_BED_TR_ONLY`, `UPDATE_BED_OWNERSHIP`, `UPDATE_BED_GUEST_ZONE`, `UPDATE_BED`).
- **Dynamic Gender Lock Fixes:**
  - Refactored `UndoService.undoCreateBooking` to correctly release a room's gender lock using the `clearGenderLockIfEmpty` logic, ensuring room availability is accurately restored when a reservation is undone.
