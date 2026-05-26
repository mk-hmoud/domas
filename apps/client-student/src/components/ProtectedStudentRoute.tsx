import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Center, Loader } from '@domas/ui';
import { useStudentAuth } from '../contexts/StudentAuthContext';

export function ProtectedStudentRoute({ children }: { children: ReactNode }) {
  const { student, isLoading } = useStudentAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Center h="100dvh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (!student) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Students with a pending application must wait for approval.
  if (student.enrollmentStatus === 'pending' && location.pathname !== '/application-status') {
    return <Navigate to="/application-status" replace />;
  }

  // Returning students (have a completed/transferred booking but no active booking)
  // must verify their current enrollment before accessing the portal.
  const needsEnrollmentVerification =
    student.enrollmentStatus !== 'pending' &&
    student.hasCompletedBooking &&
    !student.hasActiveBooking &&
    !student.enrollmentVerified;

  if (needsEnrollmentVerification && location.pathname !== '/verify-enrollment') {
    return <Navigate to="/verify-enrollment" replace />;
  }

  return children;
}
