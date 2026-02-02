import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { UsersListPage } from './pages/UsersListPage';
import { BookingsPage } from './pages/BookingsPage';
import { LocationsPage } from './pages/LocationsPage';
import { SemestersPage } from './pages/SemestersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { StudentsPage } from './pages/StudentsPage';
import { RolesPage } from './pages/RolesPage';
import { AccountingPage } from './pages/AccountingPage';
import { ProtectedRoute, PermissionRoute } from '@domas/client-core';

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
            path="accounting"
            element={
              <PermissionRoute permission="bookings.approve_financial">
                <AccountingPage />
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
            path="logs/audit"
            element={
              <PermissionRoute permission="audit.view">
                <AuditLogsPage />
              </PermissionRoute>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
