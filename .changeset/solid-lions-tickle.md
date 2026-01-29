---
"@domas/client-core": minor
"client": minor
"server": minor
"@domas/ui": minor
---

Implement permission-based route protection and navigation filtering. │ │ - Added `hasPermission` helper to `AuthContext`. │ - Created `PermissionRoute` component for protecting individual routes. │ - Created `ForbiddenPage` for unauthorized access attempts. │ - Updated `DashboardLayout` in `client` to filter navigation links based on user permissions. │ - Configured individual routes in `client` with permission requirements. │ - Updated server-side auth to return flattened permissions in user profile. │ - Added translations for the forbidden page in English and Turkish.
