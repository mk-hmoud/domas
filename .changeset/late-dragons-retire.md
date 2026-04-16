---
"@domas/ts-types": minor
---

Portal interface updates for semester pricing

- `AvailableBed`: replaced `basePrice: number | null` with `priceTry: number` and
  `priceForeign: number | null`; `roomTypeId` is now `number` (not nullable) since only
  typed+priced beds are returned
- `RoomTypeCatalogItem`: replaced `minPrice`/`maxPrice` aggregates with `priceTry: number`
  and `priceForeign: number | null` from the semester pricing matrix
