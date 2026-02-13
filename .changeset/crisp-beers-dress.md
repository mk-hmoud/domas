---
"@domas/api-client": minor
"@domas/database": minor
"server": minor
---

Implemented automated contract generation and storage system.

- **Database**:
  - Added `booking_contracts` table to store generated PDF documents as binary data (`BYTEA`).
  - Implemented `updated_at` and audit logging triggers for the contracts table.

- **Server**:
  - Created `ContractsModule` with PDF generation logic using `pdfkit`.
  - Implemented `ContractsService` to generate comprehensive Room Inventory/Stock Contracts during student check-in.
  - Added `ContractsController` to allow secure downloading of generated contracts.
  - Integrated contract generation into the `BookingsService` check-in workflow.
  - Enhanced `UndoService` to automatically clean up contracts when a check-in is reversed.
  - Fixed transaction isolation issues to ensure inventory snapshots are correctly captured in the generated PDF.

- **API Client**:
  - Added `contracts` endpoint with `downloadContract` utility for easy frontend integration.
