---
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

feat(document-templates): DB-driven PDF rendering engine

- Add `DocumentTemplatesModule` with `DocumentTemplatesService` and `DocumentTemplatesRepository`
- `DocumentTemplatesService.renderPdf(type, language, data)` loads sections from `document_templates` table and renders each section via PDFKit; supports text, rules_list, signature_row, inventory_table, deposit_info, liability_table, spacer, and page_break section types
- Placeholder interpolation (`{{student.fullName}}`, `{{room.name}}`, etc.) applied to all text content at render time
- `ContractsService` migrated to use `DocumentTemplatesService.renderPdf` for both check-in and check-out contracts; all hardcoded PDFKit logic (≈350 lines) removed
- `ContractsModule` imports `DocumentTemplatesModule`; `DocumentTemplatesModule` registered in `AppModule`
