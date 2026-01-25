---
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

feat: implement dynamic RBAC system

- database
  - Removed Static RBAC: Dropped the user_role Enum and the role column from the users table.
  - Granular Access Control: Introduced permissions and roles tables, along with role_permissions and user_roles link tables to support many-to-many relationships.
  - Recovery Admin: Added is_recovery_admin column to the users table with a unique partial index to ensure exactly one root user exists.
  - Audit Integration: Applied generic audit triggers to all new RBAC tables to track permission and role assignments.

- server
  - Entities & Interfaces: Created Role and Permission entities. Updated the User entity to support the flattened permissions list and the isRecoveryAdmin bypass.
  - Access Repository: Implemented AccessRepository to manage the lifecycle of roles, permissions, and user assignments.
  - Auth Layer: Refactored AuthService and SessionSerializer to preserve the User class instance across requests, enabling internal methods like hasPermission() and
    hasRole().
  - Root Bypass: Implemented a hard-coded bypass in the User entity where isRecoveryAdmin users implicitly possess all system permissions, regardless of assigned
    roles.

- System Initialization
  - Automatic Seeding: Enhanced the init:prod script to automatically seed a comprehensive list of system permissions (e.g., users.manage, bookings.check_in,
    locations.view).
  - Role Provisioning: Automatically creates "Student" and "Dorm Manager" system roles during initialization.
  - Secure Bootstrapping: The script now creates a unique Recovery Admin with a randomly generated 24-character password if one does not exist.

- Cleanup & Standardization
  - DTO Updates: Scrubbed the obsolete role field from all User-related DTOs (CreateUserDto, UpdateUserDto, FindAllUsersDto).
  - Dependency Resolution: Fixed a critical monorepo build issue by moving large constant arrays (COUNTRIES, PERMISSIONS, DEPARTMENTS) to local server constants to
    prevent tsc output directory mirroring.
