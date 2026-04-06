import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedStudentRoute } from './components/ProtectedStudentRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ApplyPage } from './pages/ApplyPage';
import { BookingPage } from './pages/BookingPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { FinancialPage } from './pages/FinancialPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected portal — layout added in Phase 1 Batch 2 */}
        <Route
          path="/"
          element={
            <ProtectedStudentRoute>
              {/* PortalLayout will wrap here; for now renders Outlet directly */}
              <PortalShell />
            </ProtectedStudentRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="apply" element={<ApplyPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="financial" element={<FinancialPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/** Temporary shell — will be replaced by PortalLayout in Batch 2. */
import { Outlet } from 'react-router-dom';
function PortalShell() {
  return <Outlet />;
}

export default App;
