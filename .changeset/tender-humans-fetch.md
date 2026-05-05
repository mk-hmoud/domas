---
"@domas/client-core": minor
"@domas/ui": minor
---

**`packages/ui/src/components/Damages/DamageReportTable.tsx`**

- Wrapped `Table` in `ScrollArea type="scroll"` with `miw={480}` — table scrolls horizontally on narrow screens instead of wrapping or clipping

**`packages/ui/src/components/Damages/CreateDamageModal.tsx`**

- Modal is `fullScreen` when viewport is below `sm` breakpoint (`useMediaQuery`)
- Evidence image section replaced with two explicit buttons:
  - **Take Photo** (`IconCamera`) — triggers a hidden `<input capture="environment">` — launches camera directly on mobile
  - **Gallery** (`IconPhoto`) — triggers a hidden `<input>` without capture — opens photo library
  - Both append to the same `evidenceFiles` state
- Selected files shown as `Pill` tags with individual remove buttons (`withRemoveButton`)

**`packages/client-core/src/pages/SharedDamagesPage.tsx`**

- Added a fixed camera FAB (`IconCameraFilled`, 56px circle, bottom-right) visible only below `sm` breakpoint (`hiddenFrom="sm"`) — opens `CreateDamageModal`; only rendered when user has `damages.report` permission
