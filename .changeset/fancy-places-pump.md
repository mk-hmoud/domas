---
"@domas/client-core": minor
"@domas/ts-types": minor
"@domas/ui": minor
---

1. Registry & Filtering:
   _ Added an "INT" (International) badge to both the Locations and Beds registry tables to visually identify restricted spaces.
   _ Implemented an "INT Only" checkbox in the Registry filter bar to allow staff to quickly find foreigner-specific housing. 2. Management UI:
   _ Creation: Added an "Is Foreigner Only?" toggle to the CreateLocationModal and CreateBedModal.
   _ Edit: Updated the BulkEditLocationModal to support mass-updating the Foreigner Only policy for multiple rooms or buildings at once.
   _ Detail View: The new constraint is now clearly displayed in the Location detail view sidebar. 3. Data Models (DTOs):
   _ Updated CreateLocationDto, UpdateLocationDto, FindAllLocationsDto, and FindAllBedsDto in the shared @domas/ts-types package to include the isForeignerOnly
   property
