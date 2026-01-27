---
"server": minor
---

Standardized API Error Responses (including DB errors). │ - Introduced `ApiException` and `ErrorCodes` for consistent error handling. │ - Updated `AllExceptionsFilter` to return structured JSON errors with `code` and `user_message`. │ - Added automatic mapping of PostgreSQL errors (Unique violation, FK violation) to standardized error codes. │ - Implemented smart field extraction for duplicate entry errors (e.g., "This email already exists"). │ - Added generic user-friendly fallback message for unexpected server errors (500+).
