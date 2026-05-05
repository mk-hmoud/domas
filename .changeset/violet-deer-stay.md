---
"@domas/database": minor
---

Added `student_applications` table for self-registration. Stores applicant identity fields (mirrors students), acceptance letter (filename, MIME, size, storage key), lifecycle fields (status pending/approved/rejected, rejection reason, reviewed_by, reviewed_at), and a nullable `student_id` FK set on approval. Unique partial index prevents duplicate pending applications for the same student number.
