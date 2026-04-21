---
"client": minor
"@domas/ui": minor
---

theme foundation and shell.

**Theme (`packages/ui/src/theme.ts`)**

- Set `primaryColor: "indigo"` — single professional accent across the app
- Set `defaultRadius: "md"` — uniform border radius everywhere
- Defined clean typography scale with tighter heading sizes (Manrope)
- Added minimal shadow scale (xs → xl) based on subtle opacity
- Component `defaultProps`: uniform `size="sm"` for all form inputs/buttons, `Badge` defaults to `variant="light" size="sm"`, `ActionIcon` to `variant="subtle"`, `Modal` to `centered + blur overlay`, `Table` to `highlightOnHover + comfortable spacing`, `Tooltip` to `withArrow`

**Provider**

- Fixed `defaultColorScheme` to `"light"` for consistent professional appearance
- Notifications pinned to `top-right`, limited to 5 at once

**Shell**

- Header height reduced from 60px → 52px; border softened to `gray-2`
- Sidebar width reduced from 300px → 240px; cleaner padding
- Content area background set to `gray-0` (off-white) to separate it from white panels
- Nav group items: removed decorative `ThemeIcon` wrapper; icons inline at 16px with `stroke={1.75}`; active sub-link highlighted with `indigo-0` background + `indigo-7` text
- Active link detection wired end-to-end via `useLocation` → `activeLink` prop
- Logo: removed `<Code>` version badge; icon reduced to 22px with indigo color
