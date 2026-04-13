---
"server": minor
---

apps/server — student portal

- Added GET /portal/bookings/:id/contract endpoint. Verifies the booking belongs to the authenticated student, checks contractSigned is true (otherwise 404), then
  streams the check-in contract PDF. Reuses ContractsService.getContract from the admin side.
- Imported ContractsModule into StudentPortalModule so ContractsService is injectable.
