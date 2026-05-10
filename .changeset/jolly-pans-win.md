---
"client-student": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"client": minor
"server": minor
"@domas/ui": minor
---

Implemented paid room change requests with two-step approval (staff → accounting).

**Overview**

Admins can now configure a per-semester threshold after which room change requests require a payment fee. The fee amount is set separately for Turkish nationals (TRY) and international students (foreign currency). Once a student submits a paid request, it must be approved by staff first and then confirmed by accounting before the bed move takes effect.

**Database (`@domas/database`)**

- Added `paid_room_change_after INT`, `room_change_amount_try NUMERIC(10,2)`, and `room_change_amount_foreign NUMERIC(10,2)` columns to `semesters`.
- Added `requires_payment BOOLEAN`, `payment_amount NUMERIC(10,2)`, `payment_currency CHAR(3)`, `is_accounting_approved BOOLEAN`, `accounting_approved_by UUID`, and `accounting_approved_at TIMESTAMPTZ` columns to `room_change_requests`.
- Extended `room_change_status_enum` with the `pending_payment` value.

**Shared types (`@domas/ts-types`)**

- Added `pending_payment` to `RoomChangeStatus`.
- Added payment fields to `RoomChangeRequest`, `RoomChangeRequestView`, and `StudentRoomChangeView` interfaces.
- Added `paidRoomChangeAfter`, `roomChangeAmountTry`, and `roomChangeAmountForeign` to `Semester` interface and create/update DTOs.
- Added `ApproveRoomChangePaymentDto` interface.

**API client (`@domas/api-client`)**

- Added `approvePayment(id, dto)` calling `PATCH /room-changes/:id/approve-payment`.

**Server**

- Semester DTOs and entity updated with the three new pricing fields; `create()` and `update()` in `SemestersRepository` persist them.
- `RoomChangesRepository`:
  - `create()`, `resolve()`, and `approvePayment()` now use PostgreSQL CTEs (`WITH rc AS (... RETURNING *) SELECT … FROM rc`) so the aliased `selectColumns` getter works correctly with both `INSERT … RETURNING` and `UPDATE … RETURNING`.
  - `findActiveBookingForStudent()` returns semester payment config (`paidRoomChangeAfter`, `roomChangeAmountTry`, `roomChangeAmountForeign`, `foreignCurrencyCode`).
  - New `approvePayment()` method: on accounting approval moves the bed and sets status to `approved`; on rejection sets status to `rejected`.
- `RoomChangesService`:
  - `createRequest()` determines at submission time whether payment is required and stores `paymentAmount` / `paymentCurrency` on the request.
  - `resolve()` (staff): if approved with no payment, moves the bed immediately; if approved with payment, sets `pending_payment` without moving the bed.
  - New `approvePayment()` (accounting): validates the request is in `pending_payment` state, delegates bed move to the repository.
- New `PATCH /room-changes/:id/approve-payment` endpoint guarded by the new `room_changes.approve_payment` permission.
- Added `ROOM_CHANGE_PENDING_PAYMENT` notification type sent to the student when a paid request is approved by staff and awaiting accounting.
- Seed script updated: semester creation now includes `maxRoomChanges`, `paidRoomChangeAfter`, `roomChangeAmountTry`, and `roomChangeAmountForeign`.

**Admin UI (`client` + `@domas/ui`)**

- `SemesterModal` gains a "Paid Room Change Policy" section with fields for the payment threshold and TRY / foreign fee amounts (fee fields are disabled when no threshold is set).
- `AccountingPage` gains a "Room Change Fees" tab listing requests in `pending_payment` status with approve/reject actions; processed entries appear in a history table.

**Student portal (`client-student`)**

- `RoomChangeTab` treats both `pending` and `pending_payment` as active (non-cancellable for `pending_payment`).
- Approved-but-awaiting-payment requests show a blue "Approved — Awaiting Payment" state with a fee badge displaying the amount and currency.
- Cancel button is hidden once a request reaches `pending_payment`.
