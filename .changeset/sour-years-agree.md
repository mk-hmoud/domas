---
"@domas/client-core": minor
"@domas/ui": minor
---

Guest stays — damage accountability UI.

**`CreateDamageModal`** (`@domas/ui`)

- New `guestStays?: GuestStay[]` prop (active + confirmed stays passed from the page).
- Second `MultiSelect` rendered below the student culprits picker when guest stays are present. Display label: "First Last · #IDNumber · RoomName, Bed X · dates".
- `culpritGuestStayIds` initialised to `[]` in the form and included in the submitted DTO.

**`DamageDetailsDrawer`** (`@domas/ui`)

- Liability table column header changed from "Student" to "Culprit".
- Guest liability rows display the guest name with a "(Guest · check-in date)" annotation; falls back to the raw ID when names are unavailable.

**`SharedDamagesPage`** (`@domas/client-core`)

- Loads active and confirmed guest stays on mount alongside locations and students.
- Passes the combined list to `CreateDamageModal` as `guestStays`.
- `culpritNames` string on report rows now includes guest culprit names (appended with "(guest)" label).
- `handleViewDetails` enrichment updated: student liabilities use the student map; guest liabilities rely on `guestName` / `guestStayCheckIn` already returned by the server.
