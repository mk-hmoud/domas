---
"server": minor
---

feat: Add database setup script and environment configuration
Added `scripts/setup-db.ts` for database initialization by running the sql files in packages/database.
Integrated `dotenv` for environment variable management.
Added `.env.example`.
