---
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

packages/database

- Deleted 06_student_notifications.sql — replaced by 06_notifications.sql
- New notifications table uses recipient_type + recipient_id (polymorphic) instead of a hard FK to students, so the same table can serve students, staff, and admins in
  the future. Indexes updated to cover (recipient_type, recipient_id).

apps/server/scripts/setup-db.ts

- Updated file list to run 06_notifications.sql instead of 06_student_notifications.sql.

apps/server — notifications repository

- Renamed StudentNotification → Notification; CreateNotificationData now takes recipientType/recipientId instead of studentId
- findByStudent replaced by findByRecipient(recipientType, recipientId) — all queries target the new notifications table

apps/server — notifications service

- Public API unchanged; all student-facing calls still accept studentId and internally pass recipientType: 'student'
- Internal subjects map updated to Subject<Notification>

apps/server — notifications controller

- Added /// <reference path="../../../types/session.d.ts" /> so ts-node picks up the session type augmentation when running scripts that compile the full app (e.g.
  init:prod)

packages/ts-types

- Removed studentId field from StudentNotification — no longer returned by the server after the schema change
