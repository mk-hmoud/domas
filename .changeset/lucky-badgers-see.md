---
"@domas/client-core": minor
"@domas/api-client": minor
"server": minor
"@domas/ui": minor
---

**Bookings: server-side filters and UI filter panel**

`bookings.findAll` previously only accepted `studentId` and `status`. Both the server and client have been extended.

**Server (`@domas/server`)**

- `FindAllBookingsDto`: added `semesterId`, `locationId`, `bedId`, `paymentStatus` fields
- `BookingsRepository.findAll`: handles all new filters; a `JOIN beds` is added only when `locationId` or `bedId` is present to avoid unnecessary joins
- `BookingsController.findAll`: accepts the four new query params and parses integer IDs from strings

**API client (`@domas/api-client`)**

- `bookings.findAll` filter object now includes `semesterId`, `paymentStatus`, `locationId`, `bedId`

**Bookings page (`@domas/client-core`)**

- Replaced single text-search card with a two-row filter panel: text search (client-side, matches student name and bed) + three `Select` dropdowns for semester, booking status, and payment status
- Dropdowns trigger a server re-fetch rather than client-side filtering, so results are always accurate regardless of list size
- "Clear" button appears when any dropdown filter is active
- All `fetchBookings` call-sites (create, update, date-adjust) preserve the current active filters on refresh

**i18n (`@domas/ui`)**

- Added `all_semesters`, `all_statuses`, `all_payment_statuses`, `clear_filters` keys in `en` and `tr`
