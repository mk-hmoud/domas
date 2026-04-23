import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Center, Loader } from "@mantine/core";
import { ReactNode } from "react";

export function RectorRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasPermission("rector.view")) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
