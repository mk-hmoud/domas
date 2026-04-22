---
"@domas/ui": minor
---

Header bar polish and font size accessibility control.

- ThemeToggle, LanguageSwitcher, and history button replaced `variant="default" size="xl"` with `variant="subtle" color="gray" size="md" radius="xl"` — clean circular icon buttons instead of boxy bordered squares.
- Added a vertical Divider between the icon controls and the user menu button.
- User button border-radius changed to `xl` (pill shape) with tighter padding.
- Added `FontSizeControl` component: a header icon button (IconTextSize) that opens a popover with Normal / Large / X-Large options. Applies the chosen scale to `document.documentElement.style.fontSize` so all rem-based Mantine spacing and text scales proportionally. Preference is persisted in localStorage.
- Added `vite-env.d.ts` to `packages/ui/src` and `packages/client-core/src` to resolve TypeScript errors on `*.module.css` imports.
