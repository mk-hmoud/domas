---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

feat(document-templates) — API endpoints and permissions

- Add `document_templates.manage` permission to `PERMISSIONS` constants; granted to Admin (all permissions) and Dorm Manager (inherited via non-forbidden list)
- Add `DocumentTemplatesController` at `GET/PATCH /document-templates` and `GET/PATCH /document-templates/:id`; guarded by `AuthenticatedGuard` + `PermissionsGuard` requiring `document_templates.manage`
- Add `documentTemplates` API client (`getAll`, `getById`, `update`) to `@domas/api-client`
