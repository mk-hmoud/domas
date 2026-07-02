import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { ProtectedRoute, PermissionRoute } from '@domas/client-core';
import { DashboardLayout } from './layouts/DashboardLayout';

const PageFallback = () => (
  <Center h="100vh">
    <Loader size="sm" />
  </Center>
);

const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardHome = lazy(() =>
  import('./pages/DashboardHome').then((m) => ({ default: m.DashboardHome })),
);
const UsersListPage = lazy(() =>
  import('./pages/UsersListPage').then((m) => ({ default: m.UsersListPage })),
);
const BookingsPage = lazy(() =>
  import('./pages/BookingsPage').then((m) => ({ default: m.BookingsPage })),
);
const RoomPlanPage = lazy(() =>
  import('./pages/RoomPlanPage').then((m) => ({ default: m.RoomPlanPage })),
);
const LocationsPage = lazy(() =>
  import('./pages/LocationsPage').then((m) => ({ default: m.LocationsPage })),
);
const SemestersPage = lazy(() =>
  import('./pages/SemestersPage').then((m) => ({ default: m.SemestersPage })),
);
const AuditLogsPage = lazy(() =>
  import('./pages/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })),
);
const StudentsPage = lazy(() =>
  import('./pages/StudentsPage').then((m) => ({ default: m.StudentsPage })),
);
const RolesPage = lazy(() => import('./pages/RolesPage').then((m) => ({ default: m.RolesPage })));
const TransfersPage = lazy(() =>
  import('./pages/TransfersPage').then((m) => ({ default: m.TransfersPage })),
);
const AccountingPage = lazy(() =>
  import('./pages/AccountingPage').then((m) => ({ default: m.AccountingPage })),
);
const AccountPage = lazy(() =>
  import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })),
);
const InventoryCatalogPage = lazy(() =>
  import('./pages/InventoryCatalogPage').then((m) => ({ default: m.InventoryCatalogPage })),
);
const InventoryTemplatesPage = lazy(() =>
  import('./pages/InventoryTemplatesPage').then((m) => ({ default: m.InventoryTemplatesPage })),
);
const CheckInPage = lazy(() =>
  import('./pages/CheckInPage').then((m) => ({ default: m.CheckInPage })),
);
const CheckOutPage = lazy(() =>
  import('./pages/CheckOutPage').then((m) => ({ default: m.CheckOutPage })),
);
const AccessCardsPage = lazy(() =>
  import('./pages/AccessCardsPage').then((m) => ({ default: m.AccessCardsPage })),
);
const DamagesPage = lazy(() =>
  import('./pages/DamagesPage').then((m) => ({ default: m.DamagesPage })),
);
const RoomChangesPage = lazy(() =>
  import('./pages/RoomChangesPage').then((m) => ({ default: m.RoomChangesPage })),
);
const PreReservationsPage = lazy(() =>
  import('./pages/PreReservationsPage').then((m) => ({ default: m.PreReservationsPage })),
);
const AnnouncementsPage = lazy(() =>
  import('./pages/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })),
);
const MessagesPage = lazy(() =>
  import('./pages/MessagesPage').then((m) => ({ default: m.MessagesPage })),
);
const GuestStaysPage = lazy(() =>
  import('./pages/GuestStaysPage').then((m) => ({ default: m.GuestStaysPage })),
);
const RoomTypesPage = lazy(() =>
  import('./pages/RoomTypesPage').then((m) => ({ default: m.RoomTypesPage })),
);
const DormCertificatesPage = lazy(() =>
  import('./pages/DormCertificatesPage').then((m) => ({ default: m.DormCertificatesPage })),
);
const WorkOrdersPage = lazy(() =>
  import('./pages/WorkOrdersPage').then((m) => ({ default: m.WorkOrdersPage })),
);
const TicketsPage = lazy(() =>
  import('./pages/TicketsPage').then((m) => ({ default: m.TicketsPage })),
);
const DocumentTemplatesPage = lazy(() =>
  import('./pages/DocumentTemplatesPage').then((m) => ({ default: m.DocumentTemplatesPage })),
);
const LookupsPage = lazy(() =>
  import('./pages/LookupsPage').then((m) => ({ default: m.LookupsPage })),
);
const BackupsPage = lazy(() =>
  import('./pages/BackupsPage').then((m) => ({ default: m.BackupsPage })),
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route
              path="room-plan"
              element={
                <PermissionRoute permission="locations.view">
                  <RoomPlanPage />
                </PermissionRoute>
              }
            />
            <Route
              path="users"
              element={
                <PermissionRoute permission="users.view">
                  <UsersListPage />
                </PermissionRoute>
              }
            />
            <Route
              path="students"
              element={
                <PermissionRoute permission="students.view">
                  <StudentsPage />
                </PermissionRoute>
              }
            />
            <Route path="applications" element={<Navigate to="/dashboard/students" replace />} />
            <Route
              path="bookings"
              element={
                <PermissionRoute permission="bookings.view">
                  <BookingsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="transfers"
              element={
                <PermissionRoute permission="bookings.view">
                  <TransfersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="check-in"
              element={
                <PermissionRoute permission="bookings.check_in">
                  <CheckInPage />
                </PermissionRoute>
              }
            />
            <Route
              path="check-out"
              element={
                <PermissionRoute permission="bookings.check_in">
                  <CheckOutPage />
                </PermissionRoute>
              }
            />
            <Route
              path="accounting"
              element={
                <PermissionRoute permission="bookings.approve_financial">
                  <AccountingPage />
                </PermissionRoute>
              }
            />
            <Route path="account" element={<AccountPage />} />
            <Route
              path="inventory/catalog"
              element={
                <PermissionRoute permission="inventory.manage">
                  <InventoryCatalogPage />
                </PermissionRoute>
              }
            />
            <Route
              path="inventory/templates"
              element={
                <PermissionRoute permission="inventory.manage">
                  <InventoryTemplatesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="access-cards"
              element={
                <PermissionRoute permission="access_cards.view">
                  <AccessCardsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="damages"
              element={
                <PermissionRoute permission="damages.view">
                  <DamagesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="room-changes"
              element={
                <PermissionRoute permission="room_changes.view">
                  <RoomChangesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="pre-reservations"
              element={
                <PermissionRoute permission="pre_reservations.view">
                  <PreReservationsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="locations"
              element={
                <PermissionRoute permission="locations.view">
                  <LocationsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="room-types"
              element={
                <PermissionRoute permission="locations.update">
                  <RoomTypesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="semesters"
              element={
                <PermissionRoute permission="semesters.view">
                  <SemestersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="roles"
              element={
                <PermissionRoute permission="roles.manage">
                  <RolesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="announcements"
              element={
                <PermissionRoute permission="announcements.manage">
                  <AnnouncementsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="messages"
              element={
                <PermissionRoute permission="messages.view">
                  <MessagesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="guest-stays"
              element={
                <PermissionRoute permission="guests.manage">
                  <GuestStaysPage />
                </PermissionRoute>
              }
            />
            <Route
              path="dorm-certificates"
              element={
                <PermissionRoute permission="students.view">
                  <DormCertificatesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="work-orders"
              element={
                <PermissionRoute permission="work_orders.view">
                  <WorkOrdersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="tickets"
              element={
                <PermissionRoute permission="tickets.view">
                  <TicketsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="document-templates"
              element={
                <PermissionRoute permission="document_templates.view">
                  <DocumentTemplatesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="lookups"
              element={
                <PermissionRoute permission="lookups.manage">
                  <LookupsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="logs/audit"
              element={
                <PermissionRoute permission="audit.view">
                  <AuditLogsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="backups"
              element={
                <PermissionRoute permission="backups.view">
                  <BackupsPage />
                </PermissionRoute>
              }
            />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
