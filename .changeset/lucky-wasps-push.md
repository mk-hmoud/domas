---
"server": minor
"@domas/ui": minor
---

server: - **Business Logic**: Enforced strict status transition rules; beds can now only be manually toggled between **Available** and **Maintenance**. Manual changes to or from the **Occupied** state are prohibited to protect data integrity.

client: - **Bed Management**: Updated `CreateBedModal` to only allow toggling between **Available** and **Maintenance** statuses.

- **Occupancy Protection**: The status selection is now disabled when a bed is **Occupied**, with an informative alert explaining that occupancy changes must be handled via check-out or undo processes.
- **Internationalization**: Added localized warning messages in English and Turkish for locked bed statuses.
