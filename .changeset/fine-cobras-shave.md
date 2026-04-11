---
"@domas/database": minor
"server": minor
---

Notifications are now cleaned up when their originating action is undone.

1.  **Schema** (`06_notifications.sql`): Added `source_undo_log_id BIGINT` column to the `notifications` table. Stored without a foreign-key constraint because
    `audit.undo_log` is a partitioned table with a composite primary key.

2.  **Notifications repository/service**: `create()` now accepts an optional `sourceUndoLogId` parameter that is persisted to the new column. Added
    `deleteByUndoLogId(undoLogId, client?)` to both the repository and service so deletions can participate in the same database transaction as the undo reversion.

3.  **Undo service** (`undo.service.ts`): Injects `NotificationsService`. Inside the `undo()` transaction, after the reversion is executed and before the log is
    marked as undone, all notifications linked to that undo log entry are deleted.

4.  **Bookings service** (`bookings.service.ts`): The four actions that generate both an undo log and a student notification — reject financials, approve financials,
    check-in, check-out — now capture the returned `UndoLog` from `registerUndo()` and pass its `id` as `sourceUndoLogId` when creating the notification.

5.  **Audit module**: Imports `NotificationsModule` so `NotificationsService` can be injected into `UndoService`.
