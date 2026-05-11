---
"client-student": minor
---

The login page now uses a split-panel layout on desktop:

- **Left panel (42% width)** — branded gradient background matching the portal's blue-to-teal identity. Contains the EUL logo (white-filtered), a portal title and description, and a four-item feature list (booking, financial, notifications, secure access) with frosted icon chips. Two decorative background circles add depth without visual noise.

- **Right panel** — the existing centered form, unchanged in structure. The heading and subtitle are now shown above the form card rather than inside it, which reduces visual clutter.

On mobile, the left panel is hidden (`visibleFrom="sm"`), the EUL logo appears above the form, and the layout collapses to the previous single-column design.

The utility bar (language switcher + theme toggle) was moved to an absolute-positioned top-right overlay so it doesn't push content down on either layout.
