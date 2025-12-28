---
"server": minor
---

implement locations and beds domain with hierarchy and audit support

- Entities & Enums: Defined Location and Bed entities with supporting enums (LocationType, GenderType, BedStatus).
- Locations Module:
  - Implemented LocationsRepository using ltree for hierarchical data (treePath, findChildren, findWithAncestors).
  - Implemented LocationsService with logic to construct tree paths and sanitize names.
  - Added search and pagination support.
- Beds Module:
  - Implemented BedsRepository for inventory management.
- All write operations in Services are wrapped in transactions.
- Controllers extract and pass AuditUserContext..
