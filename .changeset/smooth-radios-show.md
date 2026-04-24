---
"@domas/client-core": minor
"client": minor
"@domas/ui": patch
---

Onboarding : OnboardingModal component + i18n + DashboardLayout wiring

- Add `OnboardingModal` to `@domas/client-core`: 3-step Mantine Stepper modal (Welcome → Features → Done)
- Modal is shown automatically when `onboardingNeeded` is true; cannot be dismissed without completing or skipping
- Skip and Finish both call `completeOnboarding()` so it never re-appears
- Export `OnboardingModal` from `@domas/client-core`
- Mount `<OnboardingModal />` in `DashboardLayout`
- Add `onboarding.*` i18n keys for EN and TR
