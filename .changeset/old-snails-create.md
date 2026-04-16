---
"@domas/ui": minor
---

Room catalog: add capacity field to RoomTypeModal.

`RoomTypeModal` now includes a 1–8 `NumberInput` for capacity, defaulting to 1.
The field is populated when editing an existing room type and included in the submit payload.
