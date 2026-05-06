---
"client-student": minor
"@domas/database": minor
"@domas/ts-types": minor
"client": minor
"server": minor
---

feat(document-templates) — schema, types, and seed data

- Add `document_template_type` and `document_language` enums to `01_infrastructure.sql`; add `document_templates` table to `02_domain_schema.sql` after the contracts system; one row per type+language enforced by unique constraint
- Add `DocumentTemplate`, `DocumentSection`, and `UpdateDocumentTemplateDto` types to `@domas/ts-types`
- Seed 4 templates (check_in TR/EN, check_out TR/EN) in `init-production.ts` with all content extracted from the hardcoded `ContractsService`; idempotent — skips if rows already exist
- Update `setup-db.ts` to apply `07_document_templates.sql` during DB setup
