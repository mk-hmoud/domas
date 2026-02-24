---
"@domas/client-core": minor
"@domas/ui": minor
---

- **Booking Creation**: Improved the bed selection process.
  - Added `eligible-beds` endpoint to the server to filter beds based on student gender and nationality.
  - Updated `CreateBookingModal` to dynamically fetch and display only eligible beds for the selected student.
  - Enhanced bed labels in the selection dropdown to include full location paths.
- **Inventory Catalog**: Enhanced the search functionality.
  - Improved the client-side search to include item scope filtering (e.g., Room, Bed, Shared).
  - Updated the catalog page UI with a cleaner search bar integrated into a Card component.
- **Refactoring**: Cleaned up unused state and improved code consistency in the Bookings and Inventory pages.
