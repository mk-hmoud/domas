---
"@domas/client-core": minor
"client-student": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Added enrollment certificate verification for returning students. Students who have checked out of a previous booking and have no current active booking are required to upload a student enrollment certificate before accessing the portal. Staff can view, verify, or reject submitted certificates from the student detail drawer. The gate is enforced client-side via `ProtectedStudentRoute` using `hasCompletedBooking`, `hasActiveBooking`, and `enrollmentVerified` fields returned by `GET /portal/auth/me`.
