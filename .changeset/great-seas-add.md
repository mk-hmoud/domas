---
"@domas/database": patch
"server": patch
---

Improved database setup reliability and updated seeding logic.

- **Idempotent Setup:** Refactored `01_infrastructure.sql` to use `DO` blocks and existence checks for schemas, extensions, and partitioned tables. This allows `npm run db:setup` to be run multiple times safely.
- **Dependency Management:** Reordered table definitions in `02_domain_schema.sql` to ensure correct foreign key relationships, specifically ensuring the inventory catalog exists before templates and assignments.
- **Type Safety:** Consolidated all custom PostgreSQL ENUM types into the infrastructure script to ensure they are available for all subsequent table definitions.
- **Seed Script:** Updated `seed.ts` to automatically create standard inventory templates ("Standard Single Bed" and "Standard Triple Room"), providing a better starting point for development and testing.
