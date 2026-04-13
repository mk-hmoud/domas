---
"@domas/client-core": minor
"@domas/api-client": minor
"client": minor
"@domas/ui": minor
---

Guest stays — : API client and management UI.

**`@domas/api-client`**

- New `guests` endpoint module: `findAll` (with optional name/ID search), `findById`, `findByIdNumber`, `create`, `update`.
- New `guestStays` endpoint module: `findAll` (with status/upcoming/bedId filters), `findById`, `create`, `update`, `checkIn`, `checkOut`, `cancel`.

**Management client** (`/dashboard/guest-stays`)

- `SharedGuestStaysPage` in `@domas/client-core`: tabbed view (Active & Upcoming / Future Stays / All Stays).
- Each stay shown as a card: guest name + ID number, location path → room → bed, date range, status badge, payment badge (Paid / Partial / Unpaid) when payment is required, amount due/paid, creator name.
- Create modal (two-section form):
  - _Guest_: ID/passport number lookup — if an existing guest is found it auto-populates and the form switches to reuse mode; otherwise fields for name, email, phone, notes.
  - _Stay_: hierarchical bed selector (drilldown), check-in/out dates, payment toggle with amount + currency + notes fields.
- Edit modal: updates dates, payment fields, and notes only (guest identity and bed are locked after creation).
- Row actions: Edit, Check In (confirmed only), Check Out (active only), Cancel (confirmed or active; with confirm dialog).
- Route `GET /dashboard/guest-stays` added under `guests.manage` permission guard.
- "Guest Stays" nav entry added under Operations section (en: "Guest Stays", tr: "Misafir Konaklamaları").
