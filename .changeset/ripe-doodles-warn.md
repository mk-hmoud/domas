---
"@domas/api-client": minor
"client": minor
"server": minor
"@domas/ui": minor
---

Add image upload for room types via MinIO object storage.

- StorageService gains a `presign()` method backed by a dedicated client pointed at `STORAGE_PUBLIC_ENDPOINT`, so generated URLs are browser-accessible even when the server reaches MinIO via an internal Docker hostname.
- Room types repository transforms stored MinIO keys to 7-day pre-signed URLs on every read. New `appendImageKey` and `removeImageAtIndex` methods.
- Room types service handles upload (stores key in MinIO, appends to gallery array) and removal (deletes from MinIO, splices array). Deleting a room type now cleans up all its images from storage first.
- Two new endpoints: `POST /room-types/:id/images` (5 MB limit) and `DELETE /room-types/:id/images/:index`.
- API client gains `uploadImage` and `removeImage`.
- `RoomTypeModal` replaces the URL-paste input with a file picker. Create mode collects files locally (with instant previews) and uploads them after the room type is created on submit — no two-step flow. Edit mode uploads/deletes eagerly on each interaction.
