---
"server": minor
---

Added self-registration backend. New `StudentApplication` entity and `StudentApplicationsRepository` in the student-portal domain handle insert, find, approve (in a transaction that auto-creates the student record), and reject. Portal endpoints `POST /portal/applications` (public, multipart `letter` field) and `GET /portal/applications/:id/status` (public) enable applicants to submit and poll. Staff endpoints `GET /students/applications`, `PATCH /students/applications/:appId/review`, and `GET /students/applications/:appId/letter-url` (all under `STUDENTS_VIEW`/`STUDENTS_UPDATE`) allow review. On approval the student record is created automatically within a transaction and the application's `student_id` is set.
