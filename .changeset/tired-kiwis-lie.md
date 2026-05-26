---
"@domas/client-core": minor
"client-student": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"client": minor
"server": minor
---

- `portalApplications.getMine()` — new method; calls `GET /portal/applications/mine` (authenticated). Returns the logged-in student's `StudentApplication`.

---

- Added redirect: if `student.enrollmentStatus === 'pending'` and the current path is not `/application-status`, navigates to `/application-status` before any other redirect logic runs.
- The enrollment-verification redirect now also checks `enrollment_status !== 'pending'` so pending students are not double-redirected.

- Protected page inside the portal for students awaiting approval.
- Fetches the student's application via `portalApplications.getMine()`.
- Shows a status card (pending / rejected / approved) matching the public page's design.
- Pending: explains the review process and that they can check back by logging in.
- Approved: shows a success alert and a "Go to Dashboard" button; also watches `student.enrollmentStatus` and auto-redirects to `/dashboard` if approval happens while the page is open.
- Rejected: shows rejection reason and a link to submit a new application via the public `/register` page.

- Removed the "Save this page URL to check your status later" hint.
- Pending and rejected states now show a "Log in to check your status" button pointing to `/login`.
- Removed unused `Group` import.

- Added `ApplicationStatusPortalPage` import.
- Added `/application-status` route inside the protected `PortalLayout` tree.
