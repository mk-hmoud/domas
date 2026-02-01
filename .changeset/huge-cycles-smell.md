---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

bed: add ownership/zone policies, bulk ops, and separating policy updates

    Schema: Added ownership, is_tr_only, and is_guest_zone to beds table, entities, and DTOs.

    API: Added endpoints for bulk create/delete/update and specific endpoints for policy fields.

    Refactor: Removed policy fields from generic bed update to enforce use of specific endpoints.

    Client: Updated API client with new bulk and specific update methods.
