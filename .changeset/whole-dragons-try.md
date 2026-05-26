---
"@domas/client-core": minor
"client-student": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"client": minor
"server": minor
---

**Goal:** Create the student record at application submission time so students can log in immediately with their student number while their application is pending, rather than having to save a URL.

No schema changes required — `enrollment_status` and `student_applications.student_id` already exist.

- `create` — added optional `enrollmentStatus: 'pending' | 'enrolled'` parameter (defaults to `'enrolled'`). Passes the value to the `INSERT` statement so a pending student record can be created at application submission time.

- `insert` — updated signature: `studentId` is no longer omitted; it is now an optional field on `data` and is written to `student_id` in the `INSERT`. Also accepts an optional `PoolClient` for transaction support.
- `findByStudentId(studentId)` — new method; returns the most recently submitted application linked to a given student id (`ORDER BY submitted_at DESC LIMIT 1`).

- `submitApplication` — now runs inside a transaction. After uploading the document, it checks whether a student record already exists for the submitted student number. If not, it creates one with `enrollment_status = 'pending'`. The new application row is then inserted with `student_id` pointing to that record, so the student can log in immediately.
- `getMyApplication(studentId)` — new method; delegates to `applicationsRepository.findByStudentId` and throws `NotFoundException` if no application is found.

- `GET /portal/applications/mine` — new authenticated endpoint (requires `StudentAuthGuard`). Returns the logged-in student's most recent application via `getMyApplication`.

- `reviewApplication` (approval branch) — simplified. Since a student record is now always created at submission time, `findByStudentNumber` always returns a row. The fallback `create` call is retained only as a safety net for legacy or manually-entered applications. Both paths now converge on `setEnrollmentStatus(..., 'enrolled')` followed by cert storage (for returning type) and `approve`.
