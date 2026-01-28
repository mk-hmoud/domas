---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

- Added `revokeRoleFromUser` to `AccessService` and `AccessController`. │
  - Fixed `CreateUserDto` to include `roleIds`. │
  - Reverted access logic to use `AuditUserContext` for permission checks. │
  - **TS-Types**: Updated `CreateUserDto` to include `roleIds`. │
  - **API-Client**: Added `revokeRole` method.
  - Updated `init-production.ts` to create an 'Admin' system role and assign it all available permissions on startup.
  - Removed 'Dorm Manager' from system roles.
