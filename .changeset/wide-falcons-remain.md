---
"@domas/ts-types": minor
"server": minor
---

feat(room-types): expose room type assets in student portal

`findCurrentBookingByStudent` now LEFT JOINs `room_types` through the room's `room_type_id` and returns five additional fields:

- `roomTypeId` — nullable FK
- `roomTypeName` — display name of the type
- `roomTypeDescription` — longer description text
- `roomTypeGalleryUrls` — ordered array of photo URLs
- `roomTypeAmenities` — array of amenity strings

`StudentCurrentBooking` interface updated with the same fields (`roomTypeGalleryUrls` and `roomTypeAmenities` default to empty arrays when no type is assigned).
