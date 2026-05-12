---
"@domas/client-core": minor
"client-student": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"client": minor
"server": minor
---

Full implementation of student enrollment lifecycle, two-path registration (freshman / returning), and a dorm residency certificate request system.

---

- **`students`** — added `enrollment_status VARCHAR(20) NOT NULL DEFAULT 'enrolled' CHECK IN ('pending', 'enrolled')`. New students created via application approval start as `enrolled`; returning students whose application is re-submitted are set back to `pending` until re-approved.
- **`student_applications`** — renamed `letter_filename/mime_type/size/storage_key` → `document_filename/mime_type/size/storage_key`; added `document_type VARCHAR(20) CHECK IN ('freshman', 'returning') DEFAULT 'freshman'`; added `document_expiry_date DATE`.
- **`student_enrollment_verifications`** — added `expiry_date DATE` to track certificate validity. `NULL` means the cert never expires (legacy records).
- **`dorm_certificate_requests`** (new table) — tracks student requests for an official dormitory residency certificate. Columns: `student_id`, `enrollment_verification_id` (the cert used as proof), `status` (`pending/approved/rejected`), `rejection_reason`, `certificate_storage_key/filename` (the issued PDF), `requested_at`, `reviewed_at`, `reviewed_by`.

---

- **`DormCertificatesRepository`** — insert, findById, findByStudent, findAll (with student join + presigned URLs), hasPendingForStudent, approve (stores issued PDF key), reject.
- **`DormCertificatesService`**
  - `getEligibility(studentId)` — returns `{ eligible, reason, validCert }`. Eligible when `enrollment_status = 'enrolled'` AND a verified cert exists with `expiry_date IS NULL OR expiry_date > CURRENT_DATE`.
  - `requestCertificate(studentId, certFile?, expiryDate?)` — enforces eligibility gate; if no valid cert on file the student may upload one with the request; blocks if a pending request already exists.
  - `listAll` (admin), `approve` (uploads issued PDF, sets `approved`), `reject`.
- **`DormCertificatesController`** (`/dorm-certificates`) — admin endpoints: list all, approve with PDF upload, reject.
- **`PortalDormCertificatesController`** (`/portal/dorm-certificates`) — student endpoints: GET eligibility, GET my requests, POST request (with optional cert file + expiry date).
- **`DormCertificatesModule`** — registered in `AppModule`.

- Added `DORM_CERTIFICATES_VIEW = 'dorm_certificates.view'`
- Added `DORM_CERTIFICATES_MANAGE = 'dorm_certificates.manage'`

- **`student.entity.ts`** — added `enrollmentStatus: StudentEnrollmentStatus`.
- **`students.repository.ts`**
  - `mapRowToEntity` maps `enrollment_status`.
  - `update` handles `enrollmentStatus` field.
  - `findAll` supports filtering by `enrollmentStatus`.
  - `insertEnrollmentCert` accepts optional `expiryDate` and an optional `PoolClient` for transaction support.
  - `mapEnrollmentRow` maps `expiry_date`.
  - New `findValidEnrollmentCert(studentId)` — finds a verified cert where `expiry_date IS NULL OR expiry_date > CURRENT_DATE`.
  - New `setEnrollmentStatus(id, status, client?)`.
- **`students.service.ts`** — `reviewApplication` now handles re-registration: if a student with the same student number already exists, sets their `enrollment_status` back to `enrolled` and stores the submitted document as a new enrollment verification record, rather than creating a duplicate student. For first-time `returning` approvals the cert is also stored. Added `getApplicationDocumentUrl` (presigns `document_storage_key`).
- **`enrollment-verification.entity.ts`** — added `expiryDate?: Date`.

- **`student-application.entity.ts`** — renamed `letter*` fields to `document*`; added `documentType: ApplicationDocumentType`; added `documentExpiryDate?: Date`.
- **`student-applications.repository.ts`** — `map()` and `insert()` use new `document_*` column names.
- **`submit-application.dto.ts`** — added optional `documentType` and `documentExpiryDate`.
- **`student-portal.service.ts`**
  - Added `requireEnrolled(student)` — throws `ForbiddenException` when `enrollment_status === 'pending'`. Called before `createBooking`.
  - `uploadEnrollmentCertificate` accepts and forwards optional `expiryDate`.
  - `submitApplication` defaults `documentType` to `'freshman'`, persists `documentExpiryDate`.
- **`student-portal.controller.ts`** — `uploadCertificate` endpoint reads optional `expiryDate` from body and passes it to the service.

- **`PreReservationsService.create`** — now looks up the student and throws `ForbiddenException` if `enrollment_status === 'pending'`.
- **`PreReservationsModule`** — imports `StudentsModule` to satisfy the new dependency.

- **`RoomChangesService.createRequest`** — throws `ForbiddenException` if the student's `enrollment_status === 'pending'`.

---

- **`student.interface.ts`** — added `enrollmentStatus: StudentEnrollmentStatus`; exported `StudentEnrollmentStatus = 'pending' | 'enrolled'`.
- **`student-application.interface.ts`** — replaced `letter*` fields with `document*`; added `documentType: ApplicationDocumentType`; added `documentExpiryDate?: string`; updated `SubmitApplicationDto`; exported `ApplicationDocumentType`.
- **`enrollment-verification.interface.ts`** — added `expiryDate?: string`.
- **`dorm-certificate.interface.ts`** (new) — `DormCertificateRequestStatus`, `DormCertificateRequest`, `DormCertificateEligibility`.
- **`index.ts`** — re-exports new interface file.

---

- **`portal.ts`** — `portalApplications.submit` renamed `letterFile` param → `documentFile`; removed `photoFile`; appends `documentType` and `documentExpiryDate` to FormData. `portalEnrollment.uploadCertificate` accepts optional `expiryDate` string.
- **`dorm-certificates.ts`** (new) — `portalDormCertificates` (getEligibility, getMyRequests, request); `dormCertificates` (listAll, approve, reject).
- **`index.ts`** — re-exports new endpoint file.

---

- **`DormCertificatesPage.tsx`** (new) — thin wrapper around `SharedDormCertificatesPage`.
- **`App.tsx`** — route `/dashboard/dorm-certificates` protected by `students.view`.
- **`DashboardLayout.tsx`** — "Dorm Certificates" nav item under the Registry group.

- **`SharedStudentApplicationsPage.tsx`** — "Type" column showing `freshman`/`returning` badge; document view button label and drawer info update based on `documentType`; shows `documentExpiryDate` for returning applications.
- **`SharedStudentsPage.tsx`** — student card badges: replaced single active badge with three distinct badges: `Pending Approval` (yellow, when `enrollment_status = 'pending'`), `Active` (teal, enrolled + live booking), `Enabled/Disabled` (green/gray). Document view button label reflects document type.
- **`SharedDormCertificatesPage.tsx`** (new) — admin page to manage dorm certificate requests. Table with status filter; approve action (FileButton for PDF upload) and reject action; drawer with request details, enrollment cert preview link, issued cert download, and approve/reject UI.
- **`index.ts`** — re-exports `SharedDormCertificatesPage`.

- **`RegisterPage.tsx`** — removed photo upload; added Registration Type selector (`freshman` / `returning`); certificate expiry date field (shown and required for `returning`); upload button label and FormData field adapt to selected type.
- **`VerifyEnrollmentPage.tsx`** — restructured certificate upload from immediate-on-select to a two-step flow: pick file → shows file name + optional expiry date picker → submit button. Passes `expiryDate` to the API.
- **`DashboardPage.tsx`** — shows a yellow alert banner when `student.enrollmentStatus === 'pending'` explaining that registration is under review and portal actions are temporarily limited.
- **`DormCertificatePage.tsx`** (new) — student-facing page: checks eligibility, shows request button (with inline cert upload if no valid cert on file), and renders request history with download links for approved certificates.
- **`App.tsx`** — added `/dorm-certificate` route.
- **`PortalLayout.tsx`** — added "Dorm Certificate" nav item (`IconCertificate`) to sidebar and mobile bottom tab bar.
