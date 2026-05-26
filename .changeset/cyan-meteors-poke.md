---
"@domas/client-core": minor
"client-student": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"client": minor
"server": minor
"@domas/ui": minor
---

**Dorm certificate PDF is now system-generated on approval.**

Previously, approving a dorm certificate request required an admin to manually upload a PDF file. The certificate is now generated automatically by the server using PDFKit — the same approach used for check-in/check-out contracts.

**Server (`server`)**

- `DormCertificatesService.approve` no longer accepts a file. On approval it fetches the student's details and active booking, then generates a bilingual (TR/EN) PDF certificate containing the student's name, number, room/bed, accommodation period, date of issue, and dorm manager signature line.
- `DormCertificatesController` — removed `FileInterceptor` and `UploadedFile` from the approve endpoint; it is now a plain POST.
- `DormCertificatesModule` — imports `BookingsModule` and `LocationsModule` to support PDF generation.
- `StudentsRepository.create` — `createdByUserId` parameter widened to `string | null` to allow system-created student records (self-service applications) with no admin actor.
- `StudentPortalService.submitApplication` — passes `null` as `createdByUserId` when creating a pending student record at application submission time (fixes `invalid input syntax for type uuid: "system"` runtime error).

**API client (`@domas/api-client`)**

- `dormCertificates.approve(id)` — removed the `pdfFile` parameter; the endpoint no longer accepts a multipart upload.

**Admin UI (`@domas/client-core`)**

- `SharedDormCertificatesPage` — replaced the `FileButton` (upload PDF) approve flow with a plain approve button. Both the table row quick-action and the drawer button are updated.

**Translations (`@domas/ui`)**

- Added missing `portal.nav_dorm_certificate` key: "Dorm Certificate" (EN) / "Yurt Belgesi" (TR). The nav item was rendering the raw key string instead of a label.
