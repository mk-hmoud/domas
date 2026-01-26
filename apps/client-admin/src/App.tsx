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
import { ProtectedRoute } from '@domas/client-core';

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
          <Route path="users" element={<UsersListPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="semesters" element={<SemestersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="logs/audit" element={<AuditLogsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
