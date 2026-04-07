---
"server": minor
---

Student auth + portal module skeleton

Introduces the `StudentPortalModule` under the `/portal` namespace, providing the foundation for the student-facing portal.

**New endpoints:**

- `POST /portal/auth/login` — beta auth: accepts `{ studentNumber }`, looks up the student record, and writes `studentId` into the session. No password required for this testing phase.
- `POST /portal/auth/logout` — clears the student session.
- `GET /portal/auth/me` — returns the authenticated student's profile.
- `GET /portal/me` — alias for the profile endpoint.
- `PATCH /portal/me` — allows the student to update their contact info (email, phone number only).

**New guard:**

- `StudentAuthGuard` — checks `req.session.studentId` is present. Entirely separate from the staff `AuthenticatedGuard`; no permissions or roles involved.

**Session type augmentation:**

- `src/types/session.d.ts` extends `express-session`'s `SessionData` with `studentId?: string`.
