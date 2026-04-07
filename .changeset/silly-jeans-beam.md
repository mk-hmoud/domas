---
"client-student": minor
---

Creating UI that is Native Desktop & Mobile Redesign

Root bug fix

apps/client-student/src/index.css  
 Replaced the default Vite scaffold CSS with a proper app reset. The old file had body { display: flex; place-items: center; } — a leftover from the Vite demo template —
which caused #root to render at its intrinsic content width and be centered as a flex item, making every page appear squashed to the left. Removed all Vite demo styles  
 (h1 overrides, hardcoded link/button colours, dark-mode media query) that were conflicting with Mantine. New reset: box-sizing: border-box on all elements, body {  
 margin: 0; min-width: 320px; }, #root { width: 100%; min-height: 100vh; }.

---

Layout shell — PortalLayout.tsx

- Sidebar: width 240 → 260px, padding tightened to py="sm" px="xs". Added a "MENU" section label above nav items and a Divider separating nav from the Profile link. User
  strip at the bottom gets a Divider above it, full-width button padding, and a dimmed logout icon.
- Bottom tab bar: Moved hiddenFrom="sm" from its outer wrapper Box directly onto the bar itself, eliminating a wrapping Box. Added paddingBottom:  
  env(safe-area-inset-bottom) for notched iPhones.
- Header: height 56 → 60px. User menu in the top bar now shows first name + last name + student number on md+ (previously just first name).
- AppShell.Main: Removed the old dual-Box/dual-Outlet pattern (hiddenFrom="sm" + visibleFrom="sm"). Replaced with a single Box using responsive padding: px={{ base:
  'md', sm: 'xl', lg: '2xl' }}, pt={{ base: 'md', sm: 'lg' }}, pb={{ base: 80, sm: 'xl' }}. Mobile bottom tab bar clearance (80px) is now applied via pb instead of a  
  static inline style.

---

DashboardPage

- Replaced maw={640} mx="auto" single-column layout with a full-width Stack.
- Added StatsBand component: a SimpleGrid cols={{ base: 2, sm: 4 }} showing up to 4 clickable stat chips (Status, Payment, Room, Access Card / Days Remaining) that only
  render when a booking exists. Each chip links to the relevant page.
- Main content grid changed from md:8/4 to md:7/5. Notifications column replaced by a NotificationsPanel Paper wrapper with a left-border unread indicator per item  
  instead of full cards. Panel shows 6 items with a "View all" link.
- NoBookingCard and ActiveResidentCard use p="xl", larger icon sizes (48/52px), and SimpleGrid cols={2} for the detail rows inside ActiveResidentCard.
- All heading sizes promoted (Title order 4 → 3).

---

ApplyPage

- Added DesktopStepsSidebar component: a 220px-wide Paper panel showing all 3 steps as a vertical list with ThemeIcon circles — green filled + IconCircleCheck for
  completed, blue filled + IconCircleDot for active, gray light + IconCircle for pending.
- Desktop layout (visibleFrom="sm"): Group with the step sidebar on the left (fixed 220px) and the active step Card + navigation buttons in a flex: 1 right panel.
- Mobile layout (hiddenFrom="sm"): original Mantine Stepper at the top, full-width step Card below. Both layouts share the same stepContent and navButtons variables — no
  logic duplication.
- Title order 4 → 3, spacing gap="md" → gap="lg".

---

BookingPage

- Added Tabs, SimpleGrid imports; removed Loader (unused).
- Right column now uses Tabs (radius={0} inside a borderless Paper with overflow: hidden) with two tabs:
  - Details: SimpleGrid cols={{ base: 1, sm: 2 }} showing Room/Bed, Period, Access Card, Check-in date, and checkout alert.
  - Financial: Payment status badge, deposit, deadline, "View all transactions" button, contract download button.
- All previously stacked cards in the right column are removed in favour of the tabbed layout.
- Left column stepper card uses p="lg" and fw={700} on the heading.
- Title order 4 → 3, gap="md" → gap="lg", skeleton layout updated to match new grid.

---

NotificationsPage

- Added timeAgo() helper converting ISO timestamps to relative strings ("5m ago", "2d ago", etc.).
- Desktop (visibleFrom="sm"): Table with columns: unread dot (IconCircleFilled) | Title (bold if unread) | Message preview (lineClamp={1}) | Relative time | Mark-read  
  button. Wrapped in a bordered, rounded container for visual containment.
- Mobile (hiddenFrom="sm"): existing NotificationCard stack unchanged.
- Skeletons use two separate patterns: minimal row-height boxes on desktop, card skeletons on mobile.
- Empty state rendered identically in both layouts (no duplication of logic).

---

FinancialPage

- Summary changed from a single summary Card to a SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} with three stat cards: Total Paid (teal), Pending Transactions (orange/gray
  based on count), Damage Charges (red/gray based on amount). Each card has a 40px icon and large bold value.
- Transactions tab: Desktop (visibleFrom="sm") uses Table with columns Date | Type (badge) | Semester | Status (dot badge) | Amount (right-aligned, bold). Mobile
  (hiddenFrom="sm") keeps the existing TransactionCards stack.
- Damage Reports tab: same desktop Table / mobile cards pattern. Desktop table columns: Reported date | Description | Status badge | Amount (right-aligned red).
- Tabs now display record counts in their labels: "Transactions (N)" / "Damage Reports (N)".

---

ProfilePage

- Migrated from maw={560} single column to Grid cols={{ base: 12 }} two-column layout: identity card span={{ base: 12, sm: 5 }}, contact + session stack span={{ base:
  12, sm: 7 }}.
- Identity card: Avatar with initials, full name, student number, read-only detail rows (department, gender, nationality, DOB).
- Contact card: email + phone TextInput fields with save/error/success feedback, save button disabled until changes detected.
- Session card: sign-out button separated into its own card below the contact form.
- Title order 4 → 3, gap="md" → gap="lg".
