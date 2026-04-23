---
"@domas/client-core": minor
"client": minor
---

Rector role — routing and login redirect

- Wire `/rector` route tree into `App.tsx` — all five rector pages under `RectorRoute` + `RectorLayout`
- `AuthContext.login()` now returns `Promise<User>` so callers can act on the authenticated user immediately
- `SharedLoginPage` accepts an optional `getRedirectPath(user) => string` callback for role-aware post-login navigation
- `LoginPage` passes a `getRedirectPath` that sends users with `rector.view` to `/rector`, everyone else to `/dashboard`
