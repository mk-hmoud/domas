---
"client-student": minor
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

ApplyPage bed step: expandable room cards with taken-bed occupancy display

**Server**

- New portal repository method `findAllBedsForSemester`: returns all beds
  (available + taken) for rooms matching the student's constraints and semester
  pricing; taken beds include anonymised occupant info via LEFT JOIN on
  bookings + students (nationality_code, department)
- New service method `getAllBedsForSemester` and controller route
  `GET /portal/semesters/:id/all-beds?roomTypeId=N`

**@domas/ts-types**

- New `BedWithOccupancy` interface extending the available-bed shape with
  `isTaken`, `occupantNationality`, and `occupantDepartment` fields

**@domas/api-client**

- `portalSemesters.getAllBeds(semesterId, roomTypeId?)` endpoint

**client-student — ApplyPage BedStep**

- Rooms shown as collapsed cards; click anywhere on the header to expand
- Expanded view shows a bed grid; beds per row scales with room size (max 3)
- Available beds: teal bed icon, selectable; selected bed gets blue highlight
- Taken beds: dark card with grayed-out bed icon, flag emoji for nationality
  code, and department text; hover tooltip repeats the same info
- Room header badge shows "N free" (teal) or "Full" (red)
- Selected bed's room auto-expands when returning to the step
- Building filter from step 1 is still applied client-side
