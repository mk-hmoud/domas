---
"@domas/api-client": minor
"server": minor
---

apps/server/src/domain/student-portal/controllers/student-portal.controller.ts
GET /portal/bookings/current now throws NotFoundException when the student has no active booking, instead of returning null. NestJS serializes null controller returns as
an empty response body (via res.send()) rather than JSON null. Axios receives the empty body, fails to parse it, and returns "" as response.data. Since "" !== null is  
 true, the dashboard logic treated it as a real booking and rendered PendingBookingCard with all-undefined fields.

packages/api-client/src/endpoints/portal.ts (portalBookings.getCurrent)
Added a defensive guard: returns null for any non-object response.data. This handles the case where the server sends an empty or unexpected body, so no future
serialization quirk can surface a falsy-but-truthy value to the UI.
