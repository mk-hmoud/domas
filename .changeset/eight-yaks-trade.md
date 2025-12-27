---
"server": patch
---

- Integrated the semesters module with the Audit system
- Added @UserContext() decorator to extract authenticated user details (userId, username, ipAddress) from requests.
- Updated repositories (SemestersRepository, AuditInfrastructureRepository) to accept an optional PoolClient, enabling transactional integrity for audit logging.
- Added PaginationDto and PaginatedResult interface for standardized API responses.
