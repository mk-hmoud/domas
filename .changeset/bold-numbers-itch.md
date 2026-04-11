---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
"@domas/ui": minor
---

Messaging feature — data layer and WhatsApp number field.

1.  **Schema** (`02_domain_schema.sql`): Added `whatsapp_number VARCHAR(50)` column to the `students` table, separate from `phone_number`, so a student's WhatsApp
    contact can differ from their regular phone.

2.  **Types** (`@domas/ts-types`): Added `whatsappNumber` to `Student`, `CreateStudentDto`, and `UpdateStudentDto`. Added new `ResolveContactsDto` (scope: `all` |
    `location` | `list`) and `ResolvedContact` interface used by the upcoming email compose flow.

3.  **Server — students domain**:
    - `Student` entity, `CreateStudentDto`, `UpdateStudentDto` updated with `whatsappNumber`.
    - `StudentsRepository`: `whatsappNumber` mapped in `create`, `update`, and `mapRowToEntity`. New `resolveContacts(dto)` method resolves a flat contact list from
      any of the three scopes — all active students, active residents under a location subtree, or an explicit list of student IDs.
    - `StudentsService`: exposes `resolveContacts`.
    - `StudentsController`: new `POST /students/resolve-contacts` endpoint guarded by the new `MESSAGING_SEND` permission.
    - `PERMISSIONS`: added `MESSAGING_SEND = 'messaging.send'`.

4.  **API client** (`@domas/api-client`): Added `students.resolveContacts(dto)` calling the new endpoint.

5.  **StudentModal** (`@domas/ui`): Phone Number and WhatsApp Number fields are now shown side-by-side. The standalone email field has been moved into the nationality
    row to keep the form compact.
