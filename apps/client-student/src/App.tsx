import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedStudentRoute } from './components/ProtectedStudentRoute';
import { PortalLayout } from './layouts/PortalLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ApplyPage } from './pages/ApplyPage';
import { PreReservePage } from './pages/PreReservePage';
import { BookingPage } from './pages/BookingPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { FinancialPage } from './pages/FinancialPage';
import { ProfilePage } from './pages/ProfilePage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { VerifyEnrollmentPage } from './pages/VerifyEnrollmentPage';
import { RegisterPage } from './pages/RegisterPage';
import { ApplicationStatusPage } from './pages/ApplicationStatusPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/status" element={<ApplicationStatusPage />} />

        {/* Enrollment verification — protected (must be logged in) but outside PortalLayout */}
        <Route
          path="/verify-enrollment"
          element={
            <ProtectedStudentRoute>
              <VerifyEnrollmentPage />
            </ProtectedStudentRoute>
          }
        />

        {/* Protected portal */}
        <Route
          path="/"
          element={
            <ProtectedStudentRoute>
              <PortalLayout />
            </ProtectedStudentRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="apply" element={<ApplyPage />} />
          <Route path="pre-reserve" element={<PreReservePage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="financial" element={<FinancialPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
