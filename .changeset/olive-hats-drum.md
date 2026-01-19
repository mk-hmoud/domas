---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Implement bookings and students modules

- database
  - Students Domain: Replaced student_profiles table with a students table.
    - Supports "Manual Entry" students (no user account) and "Registered" students (linked to users).
    - Added created_by_user_id for auditing manual entries.
  - Triggers: Handle the new students table.

- server
  - Students Module:
    - Full CRUD for managing student profiles (StudentsController, StudentsService, StudentsRepository). \*Except delete, as I'm thinking of going over the db and see which tables needs soft vs hard deletes.
    - Supports manual student creation by staff.

- Shared Infrastructure
  - Types: Added Student interfaces, plus DTOs to
    @domas/ts-types.
  - API Client: Exposed students endpoint in @domas/api-client.
