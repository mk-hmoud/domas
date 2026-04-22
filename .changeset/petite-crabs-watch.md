---
"@domas/client-core": minor
"client": minor
"@domas/ui": minor
---

UI/UX overhaul of Management section pages: Announcements, Semesters, Users, and Roles.

- Announcements: colored left-border accent on cards (orange=pinned, green=published, gray=draft); publish/unpublish menu item now uses eye icons instead of pin icon.
- Semesters: replaced raw label/value Box pairs in the detail drawer with LabelValue components; null values use em-dash.
- Users: added loading state with LoadingOverlay; wrapped table and empty state in a bordered Paper card.
- Roles: replaced Tailwind `className="text-gray-500"` on stat card icons with Mantine CSS variable color.
