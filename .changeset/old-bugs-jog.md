---
"@domas/client-core": minor
"client": minor
"@domas/ui": minor
---

Tables & Empty States

- Add `EmptyState` component: icon + title + optional description/action, used as the designed empty state for all tables
- Add `table.module.css`: shared column header styles — uppercase, letter-spaced, gray-6 color; subtle gray-0 thead background with bottom border
- Apply consistent header styles (`classes.th`, `classes.thead`) to all domain tables: StudentsTable, UsersTable, BookingsTable, DamageReportTable, AccessCardTable, CardBatchTable, LocationRegistryTable, InventoryCatalogTable, InventoryTemplateTable, RoomTypesTable, PaymentsTable
- Remove `striped` prop from all tables (cleaner look with the new header treatment)
- Replace inline `<Text c="dimmed">` empty-state cells with the new `<EmptyState>` component across all tables
- Update `GenericTable` to use `EmptyState`, CSS module headers, and wrap in `ScrollArea` with optional `maxHeight` for scrollable table bodies
- Refactor `UsersTable` to use `Menu` + `IconDotsVertical` pattern (consistent with all other tables) instead of raw action icon pairs
- Fix selected-row highlight color: `blue-light` → `indigo-0` in StudentsTable and PaymentsTable (matches primary color)
- Export `EmptyState` from `@domas/ui`
