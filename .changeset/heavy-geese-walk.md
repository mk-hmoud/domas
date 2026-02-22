---
"@domas/client-core": minor
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
"@domas/ui": minor
---

Implemented multi-type contract support and automated check-out document generation.

- **Types & Enums:** Added `ContractType` enum and `BookingContract` interface to `@domas/ts-types` to standardize document handling across the system.
- **Database:** Updated `booking_contracts` table in `@domas/database` to support a composite primary key (`booking_id`, `type`), allowing multiple documents (Check-In and Check-Out) per booking.
- **Contract Logic:**
  - Enhanced `ContractsService` to generate check-out "Release and Deposit Refund" documents.
  - Updated `ContractsRepository` and `ContractsController` to support fetching documents by type.
  - **PDF Generation:**
    - Switched to `Roboto` custom font in `ContractsService` to ensure correct rendering of Turkish characters (ö, ü, ı, ş, ğ, ç) in both check-in and check-out documents.
    - Optimized inventory table layout: removed the "Kontrol" field and implemented a 2-column layout for better space efficiency.
    - Fixed text alignment and wrapping issues occurring after the 2-column inventory table.
    - Improved readability of the Rules page by increasing Turkish font size to 9 and optimized English font size to 8 to ensure single-page fit.
- **Booking Integration:** Updated `BookingsService.checkOut` to automatically trigger the generation of the check-out contract within the transaction.
- **Client Support:**
  - Updated `@domas/api-client` to allow specifying document types when downloading contracts.
  - Enhanced Check-In and Check-Out UI pages to automatically trigger contract downloads upon successful completion.
  - Added a "Download Contract" button to the Check-Out completion screen.
