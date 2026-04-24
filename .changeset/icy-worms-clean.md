---
"@domas/client-core": minor
---

Onboarding — AuthContext exposes `onboardingNeeded` + `completeOnboarding`

- Add `onboardingNeeded: boolean` to `AuthContextType` (true when user is authenticated and `onboardingCompleted` is false)
- Add `completeOnboarding()` to `AuthContextType` — calls `auth.completeOnboarding()` and optimistically updates user state
