---
"@domas/client-core": minor
"@domas/ui": minor
"client": minor
---

Rector role — frontend layout and route guard

- Add `RectorRoute` component to `@domas/client-core` — redirects unauthenticated users to `/login` and non-rector users to `/dashboard`
- Export `RectorRoute` from `@domas/client-core`
- Add `RectorLayout` to the client app — mobile-first AppShell with collapsible sidebar on desktop, fixed bottom tab bar on mobile (Overview, Occupancy, Finances, Issues, Profile)
- Add `rector.*` i18n keys to English and Turkish locale files
