---
"@domas/client-core": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"client": minor
"server": minor
---

feat(document-templates) — admin editor UI

- Add `SharedDocumentTemplatesPage` to `@domas/client-core`: tabbed editor (check_in / check_out) with language toggle (TR / EN); each section type has a dedicated inline editor:
  - `text` — textarea with bold, underline, align, and font-size controls
  - `rules_list` — per-item textarea with add/remove buttons
  - `spacer` — line-count number input
  - `signature_row` — column label editor
  - `inventory_table`, `liability_table`, `deposit_info`, `page_break` — read-only dynamic markers
- Collapsible placeholder reference panel lists all `{{…}}` vars available per template type
- Save button is disabled until changes are made; calls `PATCH /document-templates/:id` on click
- Add `DocumentTemplatesPage` to admin client at `/dashboard/document-templates`, guarded by `document_templates.manage`
- Add "Document Templates" nav item under Management section in `DashboardLayout`
