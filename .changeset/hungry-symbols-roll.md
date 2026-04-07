---
"client-student": minor
---

NotificationsContext + PortalLayout (mobile bottom nav / desktop sidebar)

**`NotificationsContext`** (`src/contexts/NotificationsContext.tsx`):

- On mount (when a student is authenticated): fetches current unread count via `GET /portal/notifications/unread-count`.
- Opens a persistent `EventSource` to `GET /portal/notifications/stream`; each incoming push event increments the unread count in real time.
- `markAsRead(id)` — calls the API and decrements the local count.
- `markAllAsRead()` — calls the API and resets count to 0.
- SSE connection is closed and cleaned up when the student logs out or the component unmounts.
- Exported via `useNotifications()` hook.

**`PortalLayout`** (`src/layouts/PortalLayout.tsx`) — built with Mantine `AppShell`:

_Mobile (< `sm` breakpoint, ~768 px):_

- Header: 56 px topbar — `DOMAS` wordmark left, notification bell (with red count indicator) + theme toggle right.
- No sidebar — collapsed unconditionally on mobile.
- Fixed 64 px `BottomTabBar` at the bottom of the viewport with 5 tabs: Home, My Room, Apply, Notifications (with badge), Financial. Tabs use `RouterNavLink` so active state is applied automatically.
- Content area has 80 px bottom padding to clear the tab bar.

_Desktop (≥ `sm` breakpoint):_

- 240 px fixed sidebar with `NavLink` items (icons + labels, active highlighting). Same 5 nav items + Profile link at top; user strip (avatar + name + student number + logout button) pinned at the bottom of the sidebar.
- Topbar spans the content area: language switcher, theme toggle, avatar/name dropdown (Profile link + Sign out) on the right.
- Notification bell is shown only in the sidebar `NavLink`; hidden from the topbar on desktop.

**`App.tsx`** — updated to use `PortalLayout` as the authenticated layout wrapper (replaces the `PortalShell` placeholder from Batch 1).

**`main.tsx`** — wraps the app in `NotificationsProvider` (inside `StudentAuthProvider` so it can access the student session).
