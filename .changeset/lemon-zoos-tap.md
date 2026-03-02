---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

Implemented student stay renewal and semester transfer mechanisms with automated inventory rollover.

- **Semester Transfers:**
  - Implemented `POST /bookings/:id/transfer` and `POST /bookings/bulk-transfer` to support moving student stays to a subsequent semester.
  - New bookings are automatically linked to their predecessors via `previousBookingId` for historical tracking.
- **Inventory Rollover:**
  - Integrated automated inventory snapshot cloning during transfers. This ensures that student responsibility for room items (desk, chair, etc.) is legally maintained across semester boundaries.
- **Resiliency & Safety:**
  - Added protection against duplicate transfers to prevent accidental double-bookings.
  - Implemented graceful handling of bed availability conflicts: bulk operations now skip unavailable beds and continue the batch instead of failing the entire transaction.
- **Client & Types:**
  - Created `TransferBookingDto` and `BulkTransferBookingDto`.
  - Updated `@domas/api-client` with dedicated methods for single and bulk transfers.
