---
"@domas/api-client": minor
"@domas/ts-types": minor
"server": minor
---

Onboarding — backend `onboarding_completed` field + API endpoint

- Add `onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE` to `users` table in schema and migration `001_add_onboarding_completed.sql`
- Add `onboardingCompleted` to `User` interface (`ts-types`) and entity/repository (server)
- Add `PATCH /auth/onboarding` endpoint (authenticated) that marks the current user's onboarding as complete
- Add `auth.completeOnboarding()` to `@domas/api-client`
