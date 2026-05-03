---
"@domas/api-client": minor
"@domas/ts-types": minor
---

**`packages/ts-types/src/interfaces/damage.interface.ts`**

- Added `DamageReportImage` interface: `id`, `damageReportId`, `filename`, `mimeType`, `size`, `createdAt` (no `storageKey` — storage keys are internal)
- Added `images?: DamageReportImage[]` to `DamageReport`

**`packages/api-client/src/endpoints/damages.ts`**

- Added `DamageReportImage` to imports from `@domas/ts-types`
- New methods:
  - `uploadImages(id, files[])` — posts `FormData` with field name `images`, returns `DamageReportImage[]`
  - `getImageUrl(id, imageId)` — returns `{ url: string }`
  - `deleteImage(id, imageId)` — DELETE, returns `void`
