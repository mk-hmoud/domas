---
"server": minor
---

**`apps/server/src/domain/damages/entities/damage-report-image.entity.ts`** _(new)_

- `DamageReportImage` entity: `id`, `damageReportId`, `filename`, `mimeType`, `size`, `storageKey`, `createdAt`

**`apps/server/src/domain/damages/repositories/damages.repository.ts`**

- Injected `StorageService` (`@Global()` — no module import needed)
- Added `randomUUID` import
- `findReportById`: added `images` JSON aggregation subquery returning `{id, damageReportId, filename, mimeType, size, createdAt}[]`
- New methods:
  - `insertImages(reportId, files[])` — uploads each file to `damages/{reportId}/{uuid}`, inserts row, returns created records
  - `findImagesByReport(reportId)` — list all images for a report
  - `findImageById(imageId, reportId)` — single image lookup
  - `deleteImage(imageId, reportId)` — deletes from storage then DB; returns `false` if not found
  - `getPresignedUrl(storageKey)` — delegates to `StorageService.presign` (7-day expiry)

**`apps/server/src/domain/damages/services/damages.service.ts`**

- Added `UnsupportedMediaTypeException` import
- New methods:
  - `addImages(reportId, files[])` — validates report exists; rejects non-image MIME types (JPEG, PNG, GIF, WebP); delegates to repository
  - `getImageUrl(reportId, imageId)` — validates image belongs to report; returns `{ url }`
  - `deleteImage(reportId, imageId)` — validates report and image exist; delegates to repository

**`apps/server/src/domain/damages/controllers/damages.controller.ts`**

- Added NestJS imports: `Delete`, `UseInterceptors`, `UploadedFiles`, `HttpCode`, `HttpStatus`
- Added `FilesInterceptor` from `@nestjs/platform-express`
- New endpoints:
  - `POST /damages/reports/:id/images` — multipart upload, field name `images`, max 10 files × 20 MB, requires `DAMAGES_REPORT`
  - `GET /damages/reports/:id/images/:imageId/url` — returns `{ url: string }`, requires `DAMAGES_VIEW`
  - `DELETE /damages/reports/:id/images/:imageId` — 204 No Content, requires `DAMAGES_MANAGE`
