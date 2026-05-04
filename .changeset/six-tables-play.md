---
"@domas/client-core": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
"@domas/ui": minor
---

**`packages/database/02_domain_schema.sql`**

- `card_batches`: added `catalog_id INT REFERENCES inventory_catalog(id)` — links a batch to a catalog item to enable snapshot creation
- `access_cards`: added `snapshot_id BIGINT REFERENCES booking_inventory_snapshots(id)` — stores the snapshot created at issuance

**`apps/server/src/domain/access-cards/entities/card-batch.entity.ts`**

- Added `catalogId?: number`

**`apps/server/src/domain/access-cards/entities/access-card.entity.ts`**

- Added `snapshotId?: number`

**`apps/server/src/domain/access-cards/dto/create-card-batch.dto.ts`**

- Added optional `@IsInt() catalogId?: number`

**`apps/server/src/domain/access-cards/repositories/access-cards.repository.ts`**

- Extracted `CARD_COLUMNS` and `BATCH_COLUMNS` constants — `snapshot_id` and `catalog_id` included in all queries
- New `findBatchById(id, client?)` method
- New `createCardSnapshot(cardId, bookingId, catalogId, issuerId, client)`:
  - Fetches catalog item (name, scope)
  - Inserts `booking_inventory_snapshots` row with `checkin_recorded_at = NOW()`
  - Updates `access_cards.snapshot_id`
- `updateCard` mapping: added `snapshotId → snapshot_id`

**`apps/server/src/domain/access-cards/services/access-cards.service.ts`**

- `issueCard`: after card is issued, fetches batch; if `batch.catalogId` is set calls `createCardSnapshot`
- `updateStatus`: when `status = LOST` and card has `snapshotId` and `currentBookingId`:
  - Resolves `location_id` via `bookings → beds → locations`
  - Inserts a `pending` `damage_report` with `snapshot_id`, `culprit_ids = [studentId]` and description `"Access card #N reported lost"`
  - Manager approves → normal liability flow creates student debt

**`packages/ts-types/src/interfaces/access-card.interface.ts`**

- `CardBatch`: added `catalogId?: number`
- `AccessCard`: added `snapshotId?: number`

**`packages/ts-types/src/dtos/access-card.dto.ts`**

- `CreateCardBatchDto`: added `catalogId?: number`

**`packages/ui/src/components/AccessCards/CardBatchModal.tsx`**

- Added `catalogItems?: InventoryCatalogItem[]` prop
- When catalog items are present, renders a clearable `Select` for linking the batch to a catalog item; hidden when list is empty

**`packages/client-core/src/pages/SharedAccessCardsPage.tsx`**

- Fetches `inventory.findAllCatalog()` alongside other data
- Passes `catalogItems` to `CardBatchModal`
