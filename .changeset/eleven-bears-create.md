---
"client-student": minor
---

Implement unread announcement counter in student portal.

- Added `AnnouncementsProvider` context to track seen announcements using `localStorage`.
- Added unread count badges to the sidebar and mobile bottom navigation bar in `PortalLayout`.
- Updated `AnnouncementsPage` to mark all announcements as seen upon visitation.
- Added 5-minute polling interval to keep the counter up to date.
