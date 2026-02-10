---
"@domas/api-client": minor
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Introduced a Turnstile Card Management system.

- **Database & Schema**:
  - Created `card_batches`, `access_cards`, and `access_card_logs` tables to manage physical card inventory.
  - Implemented high-performance card generation using PostgreSQL `generate_series`.
  - Added atomic card assignment logic with `FOR UPDATE SKIP LOCKED` to prevent race conditions in high-concurrency environments.
  - Applied automated `updated_at` and audit logging triggers to all card-related tables.

- **Server-side Implementation**:
  - Created a new `AccessCardsModule` with dedicated entities, repositories, and services.
  - Implemented atomic "issue" logic supporting both specific manual entry and random auto-assignment.
  - Added support for card returns, status updates (lost/void), and full history logging.

- **Shared Types & Client**:
  - Defined `CardStatus` and `CardActionType` enums in `@domas/ts-types`.
  - Added `CardBatch`, `AccessCard`, and `AccessCardLog` interfaces and corresponding DTOs.
  - Expanded `@domas/api-client` with a new `accessCards` endpoint for full frontend integration.
