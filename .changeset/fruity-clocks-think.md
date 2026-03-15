---
"@domas/ui": patch
---

- **Semester Management**: Fixed a bug in `SemesterModal` where deposit amounts were missing from the creation request.
  - Ensured financial fields (TRY/Foreign deposits) are explicitly converted to numbers before submission.
