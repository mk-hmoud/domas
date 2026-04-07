---
"client-student": minor
---

Project foundation, auth context, login page, routing skeleton

Replaces the Vite counter placeholder with a real application scaffold.

**Config changes:**

- `package.json` — added `react-router-dom ^7.11.0`, `@domas/api-client`, `@tabler/icons-react`
- `vite.config.ts` — set port 5173, added Vite resolve aliases for all `@domas/*` packages
- `tsconfig.app.json` — added `@domas/api-client` path mapping alongside existing `@domas/ui` and `@domas/ts-types`

**`StudentAuthContext`** (`src/contexts/StudentAuthContext.tsx`):

- Calls `GET /portal/auth/me` on mount to restore an existing session
- `login(studentNumber)` — calls `POST /portal/auth/login` (beta: student number only, no password)
- `logout()` — calls `POST /portal/auth/logout`
- Exposes `useStudentAuth()` hook

**`ProtectedStudentRoute`** (`src/components/ProtectedStudentRoute.tsx`):

- Shows a full-screen Mantine `Loader` while session is being verified
- Redirects to `/login` (with `state.from`) if no student session
- Completely independent of the admin `AuthContext` / `ProtectedRoute`

**Login page** (`src/pages/LoginPage.tsx`):

- Mobile-first single-input form (student number only)
- `inputMode="numeric"` for mobile keyboard optimization
- Language switcher + theme toggle in the top-right corner
- Redirects to the originally requested route after login, or `/dashboard` as default
- Shows a Mantine notification toast on failed sign-in

**Routing** (`src/App.tsx`):

- `/login` → `LoginPage` (public)
- `/` → `ProtectedStudentRoute` → nested portal routes:
  - `dashboard`, `apply`, `booking`, `notifications`, `financial`, `profile`
- `*` → redirects to `/`
- `PortalShell` placeholder renders `<Outlet />`; will be replaced by `PortalLayout` in Batch 2

**Page stubs** — minimal placeholder content for all 6 portal routes: `DashboardPage`, `ApplyPage`, `BookingPage`, `NotificationsPage`, `FinancialPage`, `ProfilePage`.

**`main.tsx`** — wraps the app in `DomMantineProvider` → `StudentAuthProvider` → `App`.
