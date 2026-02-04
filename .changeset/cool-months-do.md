---
"client": minor
"@domas/ui": minor
---

Implemented global Undo/Redo History system:

- Added a `UndoHistoryDrawer` component to visualize recent system actions (Create, Update, Delete).
- Integrated a history trigger button in the global `HeaderBar` for easy access from any page.
- Implemented permission-based history filtering, allowing users with `undo.all` to view and revert actions from other users.
- Added support for displaying the action performer's name or email and the target entity's unique identifier.
- Integrated one-click undo functionality with real-time UI synchronization via global events.
