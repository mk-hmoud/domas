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

  return children;
}
