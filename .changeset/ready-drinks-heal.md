---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

Integrate the RBAC permissions system. │ - **Server**: Added `PermissionsGuard`, `RequirePermissions` decorator, and applied granular permissions (Users, Roles, Locations, Bookings, Semesters) to all │
controllers. Updated `UsersService` to populate permissions. │ - **TS-Types**: Updated DTOs for Role management (Create/Update). │ - **API-Client**: Updated access endpoints to support role management.
