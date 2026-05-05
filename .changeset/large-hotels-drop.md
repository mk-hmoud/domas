---
"@domas/ui": minor
---

**`packages/ui/src/components/HeaderBar/HeaderBar.tsx`**

- New props: `mobileNavOpened?: boolean`, `onMobileNavToggle?: () => void`
- Added `Burger` button (`hiddenFrom="sm"`) to the left of the logo — toggles mobile nav drawer

**`packages/ui/src/layouts/DashboardLayout/DashboardLayout.tsx`**

- Added `mobileNavOpen` state
- Desktop sidebar wrapped in `Box visibleFrom="sm"` — invisible below `sm` breakpoint
- Added Mantine `Drawer` (left, 240px, no close button) containing the same `NavbarNested` for mobile; closes automatically on any link click
- `HeaderBar` receives `mobileNavOpened` / `onMobileNavToggle`

**`packages/ui/src/components/PageHeader/PageHeader.tsx`**

- Horizontal padding reduced on mobile: `px={{ base: "md", sm: "xl" }}`
- Title/actions `Group` changed to `wrap="wrap"` — actions flow below title on narrow screens

**`packages/ui/src/components/PageHeader/PageShell.tsx`**

- Padding reduced on mobile: `p={{ base: "md", sm: "xl" }}`
