import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { UsersListPage } from './pages/UsersListPage';
import { BookingsPage } from './pages/BookingsPage';
import { LocationsPage } from './pages/LocationsPage';
import { SemestersPage } from './pages/SemestersPage';
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
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="semesters" element={<SemestersPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
