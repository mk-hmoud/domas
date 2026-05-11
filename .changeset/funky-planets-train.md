---
"client-student": minor
---

The mobile notification card list now groups items under labelled section dividers: **Today**, **This week**, and **Earlier**. Items are bucketed client-side by comparing `createdAt` against the current date. The desktop table view is unchanged (flat list with timestamps is sufficient at that breakpoint).

When a student has an `ACTIVE` booking, a row of icon-button shortcuts appears between the stats band and the main content cards. Actions shown: **My Room** (→ `/booking`), **Payments** (→ `/financial`), and **Contract** (→ download, only if `contractSigned`). This removes the need to hunt through the `ActiveResidentCard` for the same buttons.

Replaced four inline empty-state patterns (manual `Stack + ThemeIcon + Text` blocks) with the `EmptyState` component already exported from `@domas/ui`:

- `NotificationsTable` (desktop zero-state)
- `NotificationsPage` page-level zero-state
- `AnnouncementsPage` zero-state

All four previously duplicated the same icon-title-description layout with slightly different spacing. The shared component enforces consistent padding and max-width on the description.
