---
"@domas/client-core": minor
"client": minor
"@domas/ui": minor
---

Dashboard & Loading States

- Migrate `DashboardHome` from `Container`/`Title` to `PageHeader`/`PageShell` (consistent with all other pages); subtitle now shows the portal intro text inline
- Fix dashboard embedded tables: remove `striped`, apply `thead`/`th` CSS classes matching the shared table header styles; pending bookings and damages tables now show `TableSkeleton` rows during initial load instead of disappearing entirely
- Add `TableSkeleton` component: renders N skeleton rows × N cols inside `Table.Tbody` for inline skeleton loading; exported from `@domas/ui`
- Polish `StatCard` label: add `letterSpacing: "0.05em"` to match `LabelValue` and table header typography; `fw` reduced to 600 (consistent)
- Move `LoadingOverlay` from `<PageShell>` level to inside the `<Paper>` wrapper in `SharedStudentsPage`, so the spinner overlays just the table rather than the entire page content area
