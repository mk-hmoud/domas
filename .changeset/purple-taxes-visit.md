---
"@domas/client-core": minor
"@domas/ts-types": minor
"@domas/ui": minor
---

**`packages/ts-types/src/interfaces/access-card.interface.ts`**

- Added `holderName?: string` to `AccessCard` interface — client-side enrichment field, not persisted

**`packages/ui/src/components/AccessCards/AccessCardTable.tsx`**

- Added `onMarkLost` prop; renders a red `IconAlertTriangle` action button for `active` cards (managers only)
- Holder column now displays `holderName` when present, falls back to raw UUID

**`packages/ui/src/components/AccessCards/ReportLostCardModal.tsx`** _(new)_

- Confirmation modal: shows card number and holder name, red alert describing the consequence
- Checkbox "Issue a replacement card" (shown only when the card has a `currentBookingId`)
- Optional batch selector when replacement is requested
- Emits `onConfirm(issueReplacement, batchId?)` — caller performs the API calls

**`packages/ui/src/index.tsx`**

- Exported `ReportLostCardModal`

**`packages/client-core/src/pages/SharedAccessCardsPage.tsx`**

- Loads student list alongside cards; enriches each `AccessCard` with `holderName`
- `handleMarkLost(issueReplacement, batchId?)`:
  1. `PATCH /access-cards/cards/:id/status` → `{ status: 'lost' }`
  2. If replacement requested and card has holder + booking: `POST /access-cards/issue` with same `studentId`/`bookingId`
- `lostCard` state drives `ReportLostCardModal`; requires `access_cards.manage` permission
