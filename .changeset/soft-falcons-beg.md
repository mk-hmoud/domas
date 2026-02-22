---
"server": minor
---

Enhanced check-in contract generation and introduced the Dorm Manager system role.

- **Dorm Manager Role**:
  - Introduced the `DORM_MANAGER` system role with specific operational permissions (user management and role assignment, excluding role creation and financial approvals).
  - Updated system initialization to automatically seed the `Dorm Manager` role.

- **Check-in Contract Enhancements**:
  - Implemented full localization (English/Turkish) for the entire contract based on student nationality.
  - Added a second page containing localized dormitory rules and regulations, optimized to fit a single side.
  - Dynamic Identity: The contract now dynamically populates the names of the supervising staff member and the official Dorm Manager in the signature and preamble sections.
  - Improved date formatting to include timestamps.
