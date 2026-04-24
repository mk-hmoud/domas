---
"client": minor
---

Onboarding tour — Driver.js spotlight tour

- Install `driver.js`
- Add `useOnboardingTour` hook: starts a Driver.js 5-step spotlight tour when `onboardingNeeded` is true
  - Step 1: centred welcome popover (no element target)
  - Step 2: header bar — global controls (language, theme, font, history)
  - Step 3: user menu button — account settings / logout
  - Step 4: navigation sidebar — all modules
  - Step 5: main content area — workspace intro
- Tour uses `i18next` singleton for EN/TR translations
- Finishing or clicking "Done" on the last step calls `completeOnboarding()` so it never replays
- Wire `useOnboardingTour` into `DashboardLayout`
