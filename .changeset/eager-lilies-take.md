---
"@domas/client-core": minor
"client-student": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"client": minor
"server": minor
"@domas/ui": minor
---

Added announcement board.

**Database**

- New `announcements` table appended to `06_notifications.sql` with `title`, `body`, `pinned`, `is_published`, `published_at`, `expires_at`, and `created_by` (FK to `users`).
- Partial index `idx_announcements_portal` on published, non-expired rows ordered by pinned + published date.

**Server**

- Full `AnnouncementsModule`: entity, repository, service, and two controllers.
- Repository JOINs the `users` table so every result includes the announcer's full name (`createdByName`).
- `GET/POST/PATCH/DELETE /announcements` — management CRUD, guarded by `announcements.manage` permission.
- `GET /portal/announcements` — student-facing, returns published + non-expired records ordered by pinned then published date, guarded by `StudentAuthGuard`.
- `ANNOUNCEMENTS_MANAGE` permission constant added.

**Shared types & API client**

- `Announcement` interface and `CreateAnnouncementDto` / `UpdateAnnouncementDto` added to `@domas/ts-types`.
- `announcements` (management) and `portalAnnouncements` (student) endpoint modules added to `@domas/api-client`.

**Management client** (`/dashboard/announcements`)

- `SharedAnnouncementsPage` in `@domas/client-core`: lists all announcements with published/draft badge, create/edit modal (title, body, pinned toggle, optional expiry date), publish/unpublish toggle, and delete confirm.
- Route added under `announcements.manage` permission guard.
- "Announcements" entry added to the Management nav section (en + tr).

**Student portal**

- `/announcements` page: read-only feed showing published announcements with pinned badge and announcer name + date.
- Dashboard: compact announcements panel (top 3) rendered above the notifications panel, with pinned items highlighted in orange. Panel is hidden when there are no published announcements.
- Announcer's name shown on every announcement card across all views.
- Nav entry added with `IconSpeakerphone` (en + tr i18n keys).
