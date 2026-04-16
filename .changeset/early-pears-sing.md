---
"client-student": minor
---

Visual redesign of the student portal.

ApplyPage: gradient hero banner with progress bar, premium sidebar with connector lines and step icons, hover-lift semester cards with accent stripes, visual building picker grid, hotel-style room type cards with image overlay and price, occupancy progress bars in bed step, receipt-style review panel.

LoginPage.tsx

- Replaced flat card with a centred stack: gradient IconBed brand mark (72px, 20px border-radius, box-shadow) + title + subtitle, then a floating radius="xl" card
- Sign-in button: gradient + glow shadow + right-arrow icon

DashboardPage.tsx

- Full-width gradient hero banner (greeting + student number/department + bed icon)
- Time-aware greeting (morning / afternoon / evening)
- StatsBand: left accent strip on each card instead of plain border; hover lift via onMouseEnter/onMouseLeave
- NoBookingCard: gradient header strip + clean body layout + gradient CTA button
- PendingBookingCard: colored header bar matching booking status + gradient border
- ActiveResidentCard: green gradient header + body lifted into a clean card; green gradient "View details" button
- AnnouncementsPanel + NotificationsPanel: radius="xl", item rows use tinted Paper instead of raw Box; unread dot indicator

BookingPage.tsx

- Gradient page hero showing room name, location path, semester, and status badge — color adapts (green active, red rejected, blue pending)
- Status stepper panel now has a colored border matching status
- Detail rows wrapped in tinted Paper chips (blue for room, teal for dates, grape for access card, green for check-in)
- Contract download button upgraded to gradient

ProfilePage.tsx

- Full-width gradient hero with large Avatar (white-on-blue) showing name, student number, department
- Identity panel: gradient left accent bar
- Contact card: email/phone inputs with icons; save button gradient with glow
- Sign-out section: red tinted Paper panel instead of plain card

FinancialPage.tsx

- Teal gradient page hero
- Stat cards: left accent strip with matching color gradient; figures in bold colored text
- Transaction/damage rows: left accent strip in card color; amounts in bold teal/red
- Tables wrapped in radius="xl" Paper container

NotificationsPage.tsx

- Blue gradient page hero with unread count and "Mark all read" white button
- Mobile cards: left blue accent strip (visible only when unread), gradient ThemeIcon when unread
- Loading skeleton: matches new card structure

AnnouncementsPage.tsx

- Purple/violet gradient page hero
- Each announcement: left accent strip (orange for pinned, gray otherwise); ThemeIcon for pin icon; author attributed at bottom
- Empty state: centered with ThemeIcon and descriptive subtitle

BookingStatusStepper.tsx

- Step circles: gradient ThemeIcon (green/teal for done, blue/cyan for active, filled red for error, light gray for pending)
- Connector lines: gradient green for done, blue-to-gray for active, plain gray for upcoming
- Active step gets a 3px gradient underline accent below its label
