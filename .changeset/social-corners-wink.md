---
"@domas/client-core": minor
"client-student": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"client": minor
"server": minor
---

Students can now hold a dormitory time slot for an upcoming period (e.g. summer) **without** choosing a room or bed. Admin reviews pending pre-reservations, assigns a bed, and a real booking is automatically created at that point. This decouples student sign-up from bed assignment, giving admin freedom to reorganize rooms before committing.

**Key rules:**

- Pre-reservations are semester-gated: admin must enable `allow_pre_reservations` on a semester before students can submit.
- One pending pre-reservation per student per semester (enforced by DB exclusion constraint).
- Optional room type preference (not binding — admin can assign any bed).
- Assigning a bed auto-creates a `bookings` record with status `draft`.

---

Added new enum:

```sql
CREATE TYPE pre_reservation_status AS ENUM ('pending', 'assigned', 'cancelled', 'rejected');
```

**Semesters — new column:**

```sql
ALTER TABLE semesters
    ADD COLUMN IF NOT EXISTS allow_pre_reservations BOOLEAN NOT NULL DEFAULT FALSE;
```

Admin must explicitly enable this per semester. Defaults to `FALSE` so existing semesters are unaffected.

**New table:**

```sql
CREATE TABLE pre_reservations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id),
    semester_id     INT  NOT NULL REFERENCES semesters(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    room_type_id    INT REFERENCES room_types(id),   -- optional preference
    note            TEXT,
    status          pre_reservation_status NOT NULL DEFAULT 'pending',
    booking_id      UUID REFERENCES bookings(id),    -- filled on assignment
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pre_res_date_order CHECK (end_date > start_date),
    CONSTRAINT uq_one_pending_pre_res_per_student_semester
        EXCLUDE USING btree (student_id WITH =, semester_id WITH =)
        WHERE (status = 'pending')
);

CREATE INDEX idx_pre_reservations_student  ON pre_reservations(student_id);
CREATE INDEX idx_pre_reservations_semester ON pre_reservations(semester_id);
CREATE INDEX idx_pre_reservations_status   ON pre_reservations(status);
```

---

```typescript
export type PreReservationStatus = 'pending' | 'assigned' | 'cancelled' | 'rejected';

export interface PreReservation { ... }
export interface PreReservationView extends PreReservation {
  studentName: string;
  studentNumber: string;
  semesterDisplayName: string;
  roomTypeName: string | null;
}
export interface StudentPreReservationView { ... }

// DTOs
export interface StudentCreatePreReservationDto {
  semesterId: number;
  startDate: string;
  endDate: string;
  roomTypeId?: number;
  note?: string;
}
export interface AssignPreReservationDto { bedId: number; }
export interface RejectPreReservationDto { rejectionReason?: string; }
```

Added `allowPreReservations: boolean` to `PortalSemester`:

```typescript
export interface PortalSemester {
  // ...existing fields...
  allowPreReservations: boolean; // ← new
}
```

```typescript
export * from "./interfaces/pre-reservation.interface"; // ← new
```

---

Added student-facing endpoints:

```typescript
export const portalPreReservations = {
  getAll: async (): Promise<StudentPreReservationView[]>
  create: async (dto: StudentCreatePreReservationDto): Promise<StudentPreReservationView>
  cancel: async (id: string): Promise<void>  // PATCH /:id/cancel
};
```

Staff-facing endpoints:

```typescript
export const preReservations = {
  getAll:            async (params?) => ...   // GET  /pre-reservations
  assign:            async (id, dto) => ...   // PATCH /pre-reservations/:id/assign
  reject:            async (id, dto) => ...   // PATCH /pre-reservations/:id/reject
  getAvailableBeds:  async (semesterId, startDate, endDate) => ...
};
```

```typescript
export * from "./endpoints/pre-reservations"; // ← new
```

---

```typescript
PRE_RESERVATIONS_VIEW:   'pre_reservations.view',
PRE_RESERVATIONS_MANAGE: 'pre_reservations.manage',
```

```
pre-reservations/
├── pre-reservations.module.ts
├── controllers/
│   ├── portal-pre-reservations.controller.ts   (student routes)
│   └── pre-reservations.controller.ts          (staff routes)
├── services/
│   └── pre-reservations.service.ts
├── repositories/
│   └── pre-reservations.repository.ts
└── dto/
    ├── create-pre-reservation.dto.ts
    ├── assign-pre-reservation.dto.ts
    └── reject-pre-reservation.dto.ts
```

**Routes:**

| Method  | Path                                  | Guard                     | Description                                 |
| ------- | ------------------------------------- | ------------------------- | ------------------------------------------- |
| `GET`   | `/portal/pre-reservations`            | `StudentAuthGuard`        | Student's own pre-reservations              |
| `POST`  | `/portal/pre-reservations`            | `StudentAuthGuard`        | Submit a pre-reservation                    |
| `PATCH` | `/portal/pre-reservations/:id/cancel` | `StudentAuthGuard`        | Student cancels pending request             |
| `GET`   | `/pre-reservations`                   | `PRE_RESERVATIONS_VIEW`   | Staff: list all (filter by semester/status) |
| `GET`   | `/pre-reservations/available-beds`    | `PRE_RESERVATIONS_MANAGE` | Beds available for a date range             |
| `PATCH` | `/pre-reservations/:id/assign`        | `PRE_RESERVATIONS_MANAGE` | Assign bed → auto-create booking            |
| `PATCH` | `/pre-reservations/:id/reject`        | `PRE_RESERVATIONS_MANAGE` | Reject request                              |

**Assignment transaction (service):**

1. Validate status is `pending`.
2. Check the chosen bed is free for the requested date range (against `bookings` table).
3. Insert a new `bookings` row (`status = 'draft'`).
4. Update `pre_reservations` → `status = 'assigned'`, `booking_id = <new>`.

**Student validation (service):**

- Semester must have `allow_pre_reservations = true`.
- `end_date` must be after `start_date` and both within the semester's date range.
- No existing pending pre-reservation for the same student + semester.

Both `findBookableSemesters` and `findSemesterById` now select `allow_pre_reservations AS "allowPreReservations"` so the field is available to the student portal.

```typescript
import { PreReservationsModule } from './domain/pre-reservations/pre-reservations.module';
// ...
imports: [ ..., PreReservationsModule ]
```

---

Simplified form page at route `/pre-reserve`:

1. Semester selector — only shows semesters where `allowPreReservations = true`.
2. Date pickers — default to semester start/end, clamped to semester bounds.
3. Optional room type preference (dropdown from `portalSemesters.getRoomCatalog`).
4. Optional note textarea.
5. Submit → `portalPreReservations.create(dto)` → redirect to `/dashboard`.

```tsx
<Route path="pre-reserve" element={<PreReservePage />} />
```

`NoBookingCard` now accepts `onPreReserve` and renders a secondary teal "Pre-Reserve" button when at least one semester in the list has `allowPreReservations: true`:

```tsx
{
  semesters.some((s) => s.allowPreReservations) && (
    <Button color="teal" onClick={onPreReserve}>
      Pre-Reserve
    </Button>
  );
}
```

---

Management page following the same structure as `SharedRoomChangesPage`:

- **Pending tab** — list of pending requests with student name, semester, requested dates, preferred room type, and note.
- **History tab** — assigned/rejected requests.
- **Review drawer** — opens on "Review" click:
  - Shows student info, semester, date range, room type preference, note.
  - Bed picker (dropdown fetched from `/pre-reservations/available-beds`).
  - Rejection reason textarea.
  - "Reject" / "Assign Bed" buttons. Assign is disabled until a bed is selected; on confirm it calls `preReservations.assign()` which auto-creates the booking.

```typescript
export * from "./pages/SharedPreReservationsPage"; // ← new
```

Thin wrapper:

```tsx
export function PreReservationsPage() {
  return <SharedPreReservationsPage />;
}
```

```tsx
<Route
  path="pre-reservations"
  element={
    <PermissionRoute permission="pre_reservations.view">
      <PreReservationsPage />
    </PermissionRoute>
  }
/>
```

Added nav entry under the Operations section:

```typescript
{
  label: t('nav.pre_reservations', { defaultValue: 'Pre-Reservations' }),
  link: '/dashboard/pre-reservations',
  requiredPermission: 'pre_reservations.view',
},
```

---

| File                                                                              | Change                                                                           |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `packages/database/01_infrastructure.sql`                                         | Added `pre_reservation_status` enum                                              |
| `packages/database/02_domain_schema.sql`                                          | Added `semesters.allow_pre_reservations`; new `pre_reservations` table + indexes |
| `packages/ts-types/src/interfaces/pre-reservation.interface.ts`                   | **New**                                                                          |
| `packages/ts-types/src/interfaces/portal.interface.ts`                            | Added `allowPreReservations` to `PortalSemester`                                 |
| `packages/ts-types/src/index.ts`                                                  | Export new interface                                                             |
| `packages/api-client/src/endpoints/portal.ts`                                     | Added `portalPreReservations`                                                    |
| `packages/api-client/src/endpoints/pre-reservations.ts`                           | **New**                                                                          |
| `packages/api-client/src/index.ts`                                                | Export new endpoints                                                             |
| `apps/server/src/common/constants/permissions.ts`                                 | Added `PRE_RESERVATIONS_*` permissions                                           |
| `apps/server/src/domain/pre-reservations/`                                        | **New module** (7 files)                                                         |
| `apps/server/src/domain/student-portal/repositories/student-portal.repository.ts` | Added `allow_pre_reservations` to semester queries                               |
| `apps/server/src/app.module.ts`                                                   | Registered `PreReservationsModule`                                               |
| `apps/client-student/src/pages/PreReservePage.tsx`                                | **New**                                                                          |
| `apps/client-student/src/App.tsx`                                                 | Added `/pre-reserve` route                                                       |
| `apps/client-student/src/pages/DashboardPage.tsx`                                 | Added Pre-Reserve button to `NoBookingCard`                                      |
| `packages/client-core/src/pages/SharedPreReservationsPage.tsx`                    | **New**                                                                          |
| `packages/client-core/src/index.ts`                                               | Export new page                                                                  |
| `apps/client/src/pages/PreReservationsPage.tsx`                                   | **New**                                                                          |
| `apps/client/src/App.tsx`                                                         | Added `/dashboard/pre-reservations` route                                        |
| `apps/client/src/layouts/DashboardLayout.tsx`                                     | Added sidebar nav entry                                                          |
