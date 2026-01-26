import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactNode } from "react";
import { ForbiddenPage } from "../pages/ForbiddenPage";

interface PermissionRouteProps {
  children: ReactNode;
  permission: string;
}

export function PermissionRoute({
  children,
  permission,
}: PermissionRouteProps) {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <ForbiddenPage />;
  }

  return children;
}
