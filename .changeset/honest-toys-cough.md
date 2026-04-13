---
"@domas/client-core": minor
"@domas/ui": minor
---

Messaging feature — email residents from location registry.

**`LocationRegistryTable`** (`@domas/ui`): Added optional `onEmailResidents` prop. When provided, an "Email" button appears in each non-bed row's action cell.
Clicking it passes the location's ID to the handler. Bed rows are unaffected.

**`SharedLocationsPage`** (`@domas/client-core`): Wired `onEmailResidents` on the locations tab's registry table. Opens `ComposeEmailModal` with `scope: 'location'`
so only active residents of that location subtree are resolved as recipients. The beds tab table is intentionally left without this action.
