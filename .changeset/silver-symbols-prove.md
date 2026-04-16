---
"client-student": minor
---

feat(room-types): student portal room showcase

**`RoomShowcase` component** (`components/RoomShowcase.tsx`)

- Photo gallery: hero image + thumbnail strip with click-to-swap; graceful empty state
- Amenity badges with mapped icons (WiFi, AC, Fridge, Bathroom, Desk, Wardrobe, TV, Kitchen, Heating)
- Room type description text
- Falls back to a "details pending" message when no type is configured

**`BookingPage`** — new "Room" tab (alongside Details and Financial)

- Renders `RoomShowcase` for the current booking
- Uses data already returned by the existing `getCurrent()` API call — no extra round-trip

**`DashboardPage` — `ActiveResidentCard`**

- Shows a compact room-type teaser strip (type name + up to 4 amenity badges) above the action buttons
- Only rendered when a room type is assigned
