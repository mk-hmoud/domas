---
"server": patch
---

1. Improved logging in the server:
   - Moved logging configuration to it's own file.
   - Added a mechanism to log all errors with details.
   - Integrated logging to auth and locations services/domains.

2. loosened ipRegex in Database service, previously did not allow IPv4 mapped IPv6.
