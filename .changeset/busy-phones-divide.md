---
"@domas/client-core": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
"@domas/ui": minor
---

- **Semester Management Improvements:**
- **Automated Lifecycle:** Implemented an hourly cron job in `SemestersService` to automatically transition semesters from **Planned** to **Open** (on `bookingStartDate`) and from **Open** to **Active** (on `startDate`) if `autoActivate` is enabled.
