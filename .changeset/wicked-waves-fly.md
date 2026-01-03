---
"@domas/database": patch
"server": patch
---

@domas/database: Added username column to audit.sensitive_operations.

@domas/server:

    * Fixed path of sql files in setup-db.ts script.
    * Added a reset-db.ts script that wipes out the database. (useful for development)
    * Added a debugging script for db debug-db.ts, prints audit tables schema as of now.
    * Fixed cors bug in main.ts.
    * changed the run script name from start:dev to dev to match with turbo syntax.
