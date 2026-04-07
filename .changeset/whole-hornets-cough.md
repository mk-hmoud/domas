---
"client-student": minor
---

Implementation of Student Dashboard & Booking Status

New files

apps/client-student/src/hooks/useCurrentBooking.ts  
 Reusable hook that fetches the student's current booking via portalBookings.getCurrent(). Exposes { booking, isLoading, refetch }. refetch increments a tick counter to  
 re-trigger the effect, letting any page trigger a reload without prop drilling.

apps/client-student/src/components/BookingStatusStepper.tsx  
 Custom vertical stepper component that maps BookingOpsStatus to four human-readable progress steps: Application Submitted → Under Review → Approved → Checked In. Each  
 step renders a ThemeIcon circle (filled/outlined based on state) with a connector line to the next step. Step states: done (green filled), active (blue filled), pending
(gray outlined), error (red filled). Exported alongside BookingStatusBadgeIcon for use in list views.

apps/client-student/src/pages/DashboardPage.tsx  
 Main home screen with three conditional render paths based on booking state:

- No booking (NoBookingCard): Shows the first open/bookable semester with dates, deposit amount, and "Apply Now" CTA. Falls back to a friendly empty state if no  
  semesters are open.
- Pending booking (PendingBookingCard): Shows BookingStatusStepper + rejection/approval banners depending on status.
- Active resident (ActiveResidentCard): Shows room/bed/access card/date details, View Booking and Contract download buttons; QuickStats row shows clickable payment  
  status and room name cards.
- RecentNotificationsStrip appended at the bottom — fetches last 3 notifications from the API and renders them as compact cards.

Bug fixes

- Removed unused Loader import from DashboardPage.tsx
- Replaced string literals 'pending'/'partially_paid' with PaymentStatus enum values in QuickStats
- Removed dead s() helper and isPast() function from BookingStatusStepper.tsx (leftover from an earlier draft)
- Removed unused useMantineColorScheme import/call from PortalLayout.tsx
