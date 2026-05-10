---
"client-student": minor
---

Open room change requests: student portal submission and display.

**`RoomChangeBedModal`**

- Added a `SegmentedControl` at the top of the modal with two modes: **"Choose a bed"** (existing behaviour) and **"Open request"**.
- In "Open request" mode the bed list is hidden and an info alert explains that staff will assign a bed at review time. The note field is shown immediately instead of only after a bed is selected.
- The **Submit** button is enabled in open-request mode without requiring a bed selection.
- `portalRoomChanges.create()` is called with `requestedBedId: undefined` in open-request mode.
- Mode and bed selection are reset each time the modal is opened.

**`RoomChangeTab`**

- The pending-request card now handles `requestedBedLabel === null`: shows italic "Open request — staff will assign a bed" text instead of the bed label and location path.
- History cards likewise render "Open request" when `requestedBedLabel` is null, covering cases where an open request was resolved without a specific bed label on record.
