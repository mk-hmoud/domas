import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { RectorLayout } from './layouts/RectorLayout';
import { DashboardHome } from './pages/DashboardHome';
import { RectorOverviewPage } from './pages/rector/RectorOverviewPage';
import { RectorOccupancyPage } from './pages/rector/RectorOccupancyPage';
import { RectorFinancesPage } from './pages/rector/RectorFinancesPage';
import { RectorIssuesPage } from './pages/rector/RectorIssuesPage';
import { RectorProfilePage } from './pages/rector/RectorProfilePage';
import { UsersListPage } from './pages/UsersListPage';
import { BookingsPage } from './pages/BookingsPage';
import { LocationsPage } from './pages/LocationsPage';
import { SemestersPage } from './pages/SemestersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { StudentsPage } from './pages/StudentsPage';
import { RolesPage } from './pages/RolesPage';
import { TransfersPage } from './pages/TransfersPage';
import { AccountingPage } from './pages/AccountingPage';
import { AccountPage } from './pages/AccountPage';
import { InventoryCatalogPage } from './pages/InventoryCatalogPage';
import { InventoryTemplatesPage } from './pages/InventoryTemplatesPage';
import { CheckInPage } from './pages/CheckInPage';
import { CheckOutPage } from './pages/CheckOutPage';
import { AccessCardsPage } from './pages/AccessCardsPage';
import { DamagesPage } from './pages/DamagesPage';
import { RoomChangesPage } from './pages/RoomChangesPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { GuestStaysPage } from './pages/GuestStaysPage';
import { RoomTypesPage } from './pages/RoomTypesPage';
import { ProtectedRoute, PermissionRoute, RectorRoute } from '@domas/client-core';

function App() {
  return (
    <BrowserRouter>
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
            path="guest-stays"
            element={
              <PermissionRoute permission="guests.manage">
                <GuestStaysPage />
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
        </Route>
        <Route
          path="/rector"
          element={
            <RectorRoute>
              <RectorLayout />
            </RectorRoute>
          }
        >
          <Route index element={<RectorOverviewPage />} />
          <Route path="occupancy" element={<RectorOccupancyPage />} />
          <Route path="finances" element={<RectorFinancesPage />} />
          <Route path="issues" element={<RectorIssuesPage />} />
          <Route path="profile" element={<RectorProfilePage />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
