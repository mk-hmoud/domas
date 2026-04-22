---
"@domas/client-core": minor
"client": minor
"@domas/ui": minor
---

UI/UX overhaul of Operations segment pages: Bookings, Check-In, Check-Out, Transfers, Guest Stays, Room Changes, and Accounting.

- Bookings: replaced raw Box label/value pairs in the detail drawer with LabelValue; status badge now uses color mapping instead of a bare string.
- Check-In: removed unnecessary Stack wrapper around the table Paper.
- Check-Out: replaced the Card wrapper around the search input with a bare TextInput to match Check-In layout.
- Guest Stays: StayCard now has a colored left-border accent matching stay status (green=active, blue=completed, yellow=confirmed, gray=cancelled).
- Room Changes: request cards now have left-border accents (yellow=pending, green=approved, red=rejected); card radius normalized to "md"; review panel moved from an inline block into a right-side Drawer.
- Accounting: tab counts moved from label text into rightSection Badge components.
