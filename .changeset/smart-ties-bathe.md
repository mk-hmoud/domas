---
"client": patch
"server": patch
---

**Refactor: booking status as single authority, fix nav filter**

Two correctness fixes with no behaviour change for end users.

**`isAccountingApproved` no longer checked in application logic (`@domas/server`)**

- Removed the redundant `!booking.isAccountingApproved` guard in `BookingsService.checkIn` — `status !== READY_FOR_CHECKIN` on the next line already enforces the same invariant
- `undoApproveBookingFinancials` no longer stores `previousIsAccountingApproved` in the undo snapshot; it now derives the correct boolean from `previousStatus` at undo time, keeping the two fields in sync by construction
- Removed `isAccountingApproved` from `undoUpdateBooking`'s allowed-fields map so a generic field restore cannot set the flag independently of status
- The DB column, entity field, and repository mapping are unchanged — the column remains useful as audit metadata alongside `accountingApprovedAt`

**Nav filter explicit for permission-free items (`@domas/client`)**

- `DashboardLayout` nav filter previously relied on `hasPermission(undefined) === true` to keep the Dashboard entry visible; changed to an explicit `!requiredPermission || hasPermission(requiredPermission)` check so the intent is clear and the behaviour does not depend on an implementation detail of `hasPermission`
