import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { ProtectedRoute, SharedUsersPage, SharedLocationsPage } from '@domas/client-core';
import { UserRole } from '@domas/ts-types';

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
            path="students"
            element={<SharedUsersPage title="nav.students" role={[UserRole.STUDENT]} />}
          />
          <Route
            path="staff"
            element={
              <SharedUsersPage
                title="nav.staff"
                role={[UserRole.DORM_MANAGER, UserRole.DORM_STAFF, UserRole.ACCOUNTING_STAFF]}
              />
            }
          />
          <Route path="locations" element={<SharedLocationsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
