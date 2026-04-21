---
"@domas/client-core": minor
"client": minor
"@domas/ui": minor
---

Drawers, Modals & LabelValue

- Add `LabelValue` component: standardized label/value layout for detail drawers — label is uppercase, letter-spaced, gray-6 (matching table headers); value auto-wraps strings in `<Text size="sm" fw={500}>` and renders ReactNode children as-is for badges, codes, etc. Exported from `@domas/ui`
- Apply `LabelValue` to standalone drawer components: `DamageDetailsDrawer`, `InventoryCatalogDrawer`
- Apply `LabelValue` to inline detail drawers in shared pages: `SharedUsersPage`, `SharedStudentsPage`, `SharedTransfersPage`
- Update `DamageDetailsDrawer`: remove `Title` heading in favor of `Text fw={700}`, apply `LabelValue`, fix liabilities table to use styled headers (CSS module) instead of `striped`
- Update `InventoryCatalogDrawer`: apply `LabelValue`, tighten spacing
- Fix `CheckInDetailsModal`: remove `striped` from inventory and extras tables, fix assigned-card highlight from `blue-light` to `indigo-0`
- Remove unused `Box` import from `SharedUsersPage`, `SharedStudentsPage`, `SharedTransfersPage`
