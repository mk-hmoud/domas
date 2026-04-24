---
"@domas/ui": minor
"@domas/client-core": patch
"client": patch
---

Onboarding tour — add tour anchor IDs + remove OnboardingModal

- Add `id="domas-header"` to `<header>` in `HeaderBar`
- Add `id="domas-user-menu"` to the user menu trigger in `HeaderBar`
- Add `id="domas-navbar"` to `<nav>` in `NavbarNested`
- Add `id="domas-content"` to the main content `Box` in `DashboardLayout`
- Remove `OnboardingModal` component and its export from `@domas/client-core`
- Remove `<OnboardingModal />` usage from `DashboardLayout`
- Replace modal-style i18n keys with tour-step keys (`onboarding.steps.*`) in EN + TR
