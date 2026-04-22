---
"@domas/client-core": minor
"client": minor
"@domas/ui": minor
---

fix LoadingOverlay placement across remaining pages. Moved LoadingOverlay from PageShell level into Paper/Stack containers with position:relative in SharedAnnouncementsPage, SharedBookingsPage, SharedGuestStaysPage, and SharedInventoryCatalogPage. Replaced inline empty-state Text with EmptyState components. Cleaned up Title usage in RolesPage.
