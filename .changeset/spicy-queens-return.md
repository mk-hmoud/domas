---
"@domas/ui": patch
---

implement navigation callback for Navbar links

- Links in the NavbarNested component were non-functional because event.preventDefault() was called without providing a mechanism for client-side
  routing, preventing navigation entirely.
- Introduced an optional onLinkClick callback prop to NavbarNested and NavbarLinksGroup. This allows consuming applications (like client)
  to inject their specific routing logic (e.g., useNavigate) while keeping the UI package decoupled from any router implementation.
