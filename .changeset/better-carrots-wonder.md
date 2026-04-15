---
"@domas/client-core": minor
"@domas/ui": minor
---

Management UI updates for semester pricing architecture

**@domas/ui**

- `RoomTypeModal`: capacity field is now required (no default shown; validation error shown if
  empty); removed `?? 1` fallback; added `withAsterisk` to the NumberInput
- `RoomTypesTable`: added Capacity column
- `CreateLocationModal`: removed `basePrice` field entirely; room type selector is now
  required (not clearable) when type is ROOM, shows capacity hint in label, validated on submit

**@domas/client-core**

- `SharedSemestersPage`: semester detail drawer now includes an inline pricing matrix — loads
  all room types via `GET /semesters/:id/pricing`, allows editing price TRY + foreign inline,
  saves via `PUT /semesters/:id/pricing`
- `SharedLocationsPage`: removed `basePrice` badge; added yellow "No room type" warning badge
  for ROOM nodes missing a room type; added room type name badge (green) when assigned
