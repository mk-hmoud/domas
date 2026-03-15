---
"@domas/client-core": minor
"@domas/api-client": minor
"@domas/ts-types": minor
"@domas/ui": minor
---

- Contextual Actions: Added a "Create Booking" button to the Location Detail panel (for Rooms and Beds) and a "Book Bed" option to the BedCard dots menu.
- Smart Auto-Fill (Hydration): Enhanced the HierarchicalBedSelector to automatically fetch and pre-populate the entire building hierarchy (University → Room) when a
  booking is started from a specific location.
- Seamless Integration: Connected the Locations view to the Students and Semesters APIs, allowing users to complete a full booking without leaving the page.
- API Support: Added findByLocation to the beds API client to enable instant lookups for the hierarchical auto-fill logic.
