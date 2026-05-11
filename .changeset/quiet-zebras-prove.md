---
"client-student": minor
---

Introduces two shared components and replaces all ad-hoc page hero and section header patterns across the student portal.

- **`PageHero`** (`components/PageHero.tsx`) — single source of truth for the full-width gradient banner used at the top of every portal page. Accepts `label`, `title`, `subtitle`, `icon` (renders in a frosted ThemeIcon), `leftSection` (fully custom left content), `rightSection` (custom right slot), and a `color` enum (`blue | green | red | teal | purple`) that drives both gradient and shadow. All five gradient/shadow combos are defined once inside the component.

- **`SectionTitle`** (`components/SectionTitle.tsx`) — the accent-bar-before-title pattern previously duplicated inline. Accepts `children` and an optional `mb` margin-bottom prop.

| Page              | Change                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------- |
| DashboardPage     | Greeting hero → `<PageHero leftSection={…} icon={…} />`                                  |
| BookingPage       | Status hero → `<PageHero color={headerColor} leftSection={…} rightSection={…} />`        |
| FinancialPage     | Hero → `<PageHero color="teal" label title subtitle icon />`                             |
| NotificationsPage | Hero → `<PageHero label title subtitle rightSection={button+icon} />`                    |
| AnnouncementsPage | Hero → `<PageHero color="purple" label title subtitle icon />`                           |
| ProfilePage       | Hero → `<PageHero leftSection={avatar+name} />`; both section headers → `<SectionTitle>` |

`StatsBand` in `DashboardPage` previously used raw `onMouseEnter` / `onMouseLeave` DOM style mutations for the card hover lift effect. Replaced with a CSS module (`.statCard` / `.statCard:hover`) so the transition is handled by the browser's style engine, not manual imperative patching.

Removed `Card`, `Divider`, and other no-longer-used Mantine imports from ProfilePage and AnnouncementsPage following the hero extraction.
