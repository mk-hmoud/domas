---
"client-student": minor
---

The sidebar now opens with a dedicated header section containing a DOMAS wordmark and a "Student Portal" sub-label, separated from the nav links by a divider. Previously the sidebar had no visual identity of its own.

The bottom user strip previously logged the student out on click — a significant UX mistake. It is now split into two distinct actions:

- Clicking the user row (name + student number) navigates to `/profile`
- An explicit red `IconLogout` ActionIcon handles sign-out

The top bar now shows the current page name alongside the DOMAS logo (e.g., `DOMAS · My Room`). This gives users context at a glance, especially on mobile where no sidebar is visible.

Reduced from 6 to 5 items on the mobile bottom bar. Notifications was removed from the bottom bar because a notification bell with an unread indicator already exists in the TopBar on mobile. Profile was added to the bottom bar since it was previously unreachable on mobile without navigating to the sidebar.

New order: Dashboard · My Room · Announcements · Financial · Profile
