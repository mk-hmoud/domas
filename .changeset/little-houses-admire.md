---
"client-student": minor
---

Implementation of Remaining Pages

Modified files

apps/client-student/src/pages/BookingPage.tsx (full replacement)
Detailed booking view page. On mount checks useCurrentBooking — if no booking exists, redirects to /apply. Shows:

- BookingStatusStepper with a status badge (Active / Ready for Check-In / Under Review / Not Approved)
- Rejection alert if status is REJECTED
- Accommodation details card: room/bed, location path, access card number (when active), period dates, check-in date
- Financial summary card: payment status badge, deposit amount, payment deadline, link to Financial page
- Contract download button (only shown when contractSigned = true)
- Check-out info alert (when checkedOutAt is set)

apps/client-student/src/pages/NotificationsPage.tsx (full replacement)
Full notification list page with:

- Per-item NotificationCard — unread items highlighted in blue with a mark-as-read ActionIcon
- "Mark all read" button in the header (only shown when there are unread items)
- Paginated loading — fetches 20 at a time with a "Load more" button
- Calls markAsRead / markAllAsRead from NotificationsContext to keep the global badge count in sync
- Skeleton loading state, empty state with icon

apps/client-student/src/pages/FinancialPage.tsx (full replacement)
Financial overview page with:

- Summary card showing total approved payments and outstanding damage charges
- Orange alert when damage charges are present
- Two Tabs: Transactions and Damage Reports
- Transactions tab: colored badges per type (deposit/rent/fine), approved/pending status dot, amount right-aligned
- Damage Reports tab: report status badge (approved=red, rejected=gray, pending=orange), description and reported date
- Both tabs use Promise.all to load in parallel on mount

apps/client-student/src/pages/ProfilePage.tsx (full replacement)
Profile page with:

- Identity card: avatar with initials, full name, student number, department, gender, nationality, birth date (all read-only)
- Contact information card: editable email and phone fields, save button disabled until changes are detected, success/error feedback; calls portalProfile.updateContact()
- Session card: shows current student number, Sign Out button that calls logout() from StudentAuthContext
