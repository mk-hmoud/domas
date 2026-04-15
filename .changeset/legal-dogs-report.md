---
"@domas/client-core": minor
---

ApplyPage pricing field updates

- Bed list: replaced `bed.basePrice` display with `bed.priceTry` (always present now that only
  typed+priced beds are returned)
- Room catalog cards: replaced `rt.minPrice`/`rt.maxPrice` with `rt.priceTry` (single price
  per room type per semester from the pricing matrix)
- Review step: added "Accommodation price" row showing `bed.priceTry` and optional
  `bed.priceForeign` alongside the existing deposit row
