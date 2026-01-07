---
"@domas/api-client": minor
"@domas/database": patch
"@domas/ts-types": patch
"server": patch
---

domas/database: Added a new location type 'University', this is meant to be only created once as the root node of the locations ltree.

domas/ts-types: Updated locationtype enum to include university type.

domas/server: Updated server location type enum as well, also add to init script the creation of the root node.

domas/api-client: Added locations endoints with full CRUD capabilities.
