---
"@domas/client-core": minor
"@domas/ui": minor
---

**`packages/ui/src/components/Damages/CreateDamageModal.tsx`**

- `onSubmit` prop signature changed to `(values: CreateDamageReportDto, files: File[]) => Promise<void>`
- Added `evidenceFiles` state (`File[]`)
- Added `FileInput` (multi-select, images only: JPEG/PNG/GIF/WebP, max 10) below the description field; selected files shown as `Pill` tags
- `handleSubmit` passes `evidenceFiles` to `onSubmit` and resets file state on completion

**`packages/ui/src/components/Damages/DamageDetailsDrawer.tsx`**

- New props: `canManage`, `onGetImageUrl(imageId) => Promise<string>`, `onDeleteImage(imageId) => Promise<void>`
- Added per-image loading state: `viewingImageId` and `deletingImageId`
- Added **Evidence Images** section (between culprits and liabilities):
  - Lists each image in `report.images` as a row: filename, formatted size, view button (`IconExternalLink`) that fetches the presigned URL and opens it in a new tab, delete button (`IconTrash`) visible only when `canManage` is true
  - Shows "No evidence images attached" when the array is empty
- Added `formatBytes` helper

**`packages/client-core/src/pages/SharedDamagesPage.tsx`**

- `handleCreateReport` now accepts `files: File[]`; after the report is created it calls `damages.uploadImages(report.id, files)` when files are present
- Added `handleGetImageUrl(imageId)` — delegates to `damages.getImageUrl` using the current `selectedReport`
- Added `handleDeleteImage(imageId)` — calls `damages.deleteImage`, then removes the image from `selectedReport.images` in local state
- `DamageDetailsDrawer` receives `canManage`, `onGetImageUrl`, `onDeleteImage`
