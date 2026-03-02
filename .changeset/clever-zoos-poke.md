---
"@domas/client-core": minor
"@domas/ts-types": minor
"server": minor
"@domas/ui": minor
---

Streamlined access card batch creation and enforced location type restrictions.

- **Automated Naming:** Access card batches now automatically generate their names based on the associated location and card range (e.g., "Building North (0-100)").
- **Location Restrictions:** Enforced a rule that access card batches can only be associated with locations of type `building` or `block`.
- **DTO Cleanup:** Removed the manual `name` field from the batch creation request.
