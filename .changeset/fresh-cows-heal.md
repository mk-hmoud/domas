---
"server": minor
---

Security: Enforce "Subset Permission" logic. │ - Users can only assign roles if they possess all permissions granted by that role. │ - Users can only view roles if they possess all permissions granted by that role. │ - Updated `AccessService` and `AccessController` to enforce these checks.
