---
"@domas/client-core": minor
"client": minor
"@domas/ui": minor
---

PageHeader and PageShell components, rolled out site-wide.

**New components (`packages/ui`)**

- `PageHeader` — full-width white band with `title`, optional `subtitle`, and optional `actions` slot (right-aligned). Sits at the very top of each page content area, separated by a `gray-2` border-bottom.
- `PageShell` — inner content wrapper providing a `Container` with consistent `p="xl"` padding and a configurable `size` prop (defaults to `"lg"`).

**Migrated pages (all 17)**
Every shared page in `packages/client-core` and the `RolesPage` in `apps/client` now uses `PageHeader` + `PageShell` instead of the ad-hoc `Container` / `Group justify="space-between"` / `Title` pattern:

SharedBookingsPage, SharedStudentsPage, SharedSemestersPage, SharedUsersPage, SharedAnnouncementsPage, SharedLocationsPage, SharedAccessCardsPage, SharedAuditLogsPage, SharedCheckInPage, SharedCheckOutPage, SharedDamagesPage, SharedGuestStaysPage, SharedInventoryCatalogPage, SharedInventoryTemplatesPage, SharedTransfersPage, SharedRoomChangesPage, RolesPage.

Pages with a subtitle (description line) — AccessCards, CheckIn, CheckOut, Damages, InventoryCatalog, Roles — now surface it via the `subtitle` prop for consistent treatment.

Pages where the right-side "action" is a filter control (AuditLogs → rows-per-page Select, RoomChanges → semester Select, Locations → view SegmentedControl) pass it through the `actions` slot, keeping the header anatomy consistent.
