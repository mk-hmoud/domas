---
"client-student": minor
---

Added self-registration flow to the student portal. New public `/register` page — a full multi-field form (identity, nationality, department, optional contact) with acceptance letter file upload (PDF/JPEG/PNG/WebP, max 10 MB). On submit, redirects to `/register/status?id=...` where the applicant can see their application status (pending/approved/rejected) with rejection reason when present. Approved state shows a "Go to Login" button. Login page gains a "New student?" divider and "Apply for accommodation" button linking to `/register`.
