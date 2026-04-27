---
"@domas/ui": minor
---

Add optional badge counter to navbar sub-link items.

`NavbarLinksGroup` and `NavbarNested` now accept an optional `badge?: number` on each sub-link. When the value is greater than zero a small red filled `Badge` is rendered inline next to the label. Values above 99 display as "99+".
