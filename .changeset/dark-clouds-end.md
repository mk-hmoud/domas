---
"@domas/client-core": minor
"client": minor
"@domas/ui": minor
---

Implemented a comprehensive Damage Management UI to handle property damage reporting and administrative review.

Key features include:

- **Centralized Dashboard**: A new Damage Reports page for staff to monitor and manage all property damage incidents.
- **Advanced Reporting Workflow**:
  - **Smart Location Search**: Integrated a new `SmartLocationSelector` that allows staff to find rooms instantly by searching names or numbers, with full parent path context (e.g., Block/Floor).
  - **Context-Aware Inventory**: When a location is selected, the system dynamically fetches all inventory assigned to that room and its beds, allowing damage to be linked directly to specific physical assets.
  - **Flexible Pricing**: Support for both catalog-based pricing (automated from global inventory) and manual cost entry for non-standard damages.
- **Administrative Review**:
  - **Detailed Review Drawer**: A dedicated view for managers to inspect damage descriptions, identified culprits, and estimated costs.
  - **Approval & Liability**: Approval of a report now correctly displays finalized student liabilities, while pending reports prominently show the identified culprits.
- **Granular Security**: Integrated new `damages.report` and `damages.manage` permissions to separate reporting staff from administrative reviewers.
- **Full Localization**: Complete English and Turkish support for all damage-related interfaces, instructions, and system notifications.
