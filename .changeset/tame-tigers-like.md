---
"@domas/client-core": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
"@domas/ui": minor
---

**`packages/database/02_domain_schema.sql`**

- `students`: added `photo_storage_key VARCHAR(500)` (nullable)

**`apps/server/src/domain/students/entities/student.entity.ts`**

- Added `photoStorageKey?: string`, `photoUrl?: string` (transient — set by service after presigning)

**`apps/server/src/domain/students/repositories/students.repository.ts`**

- `mapRowToEntity`: maps `photo_storage_key` → `photoStorageKey`
- New `setPhotoKey(id, key)` and `clearPhotoKey(id)` methods

**`apps/server/src/domain/students/services/students.service.ts`**

- Injected `StorageService` (globally available)
- `findById`: presigns `photoStorageKey` → `photoUrl`; clears key from returned object so storage paths are never exposed to clients
- `uploadPhoto(id, file)`: validates MIME (JPEG/PNG/WebP), deletes old photo if present, uploads to `students/{id}/photo`, returns `{ photoUrl }`
- `deletePhoto(id)`: deletes from storage, clears key

**`apps/server/src/domain/students/controllers/students.controller.ts`**

- `POST /students/:id/photo` — `multipart/form-data`, field `photo`, max 10 MB, requires `STUDENTS_UPDATE`
- `DELETE /students/:id/photo` — 204, requires `STUDENTS_UPDATE`

**`packages/ts-types/src/interfaces/student.interface.ts`**

- Added `photoUrl?: string`

**`packages/api-client/src/endpoints/students.ts`**

- `uploadPhoto(id, file)` — FormData POST, returns `{ photoUrl }`
- `deletePhoto(id)` — DELETE

**`packages/ui/src/components/Students/StudentsTable.tsx`**

- Added `Avatar` (initials, 32 px) column between student number and name

**`packages/client-core/src/pages/SharedStudentsPage.tsx`**

- `handleSelectStudent`: calls `students.findOne(id)` on row click → stores result in `detailStudent` (has presigned `photoUrl`); falls back to list data on error
- Drawer photo section: 96 px avatar (shows photo if available, initials otherwise); camera button to upload, trash button to delete (visible only when photo exists); both buttons show loading state during upload/delete
- `detailStudent` state clears on drawer close
