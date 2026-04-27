import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  const normalizedRole = user?.role.toLowerCase();
  const normalizedAllowedRoles = allowedRoles?.map((role) => role.toLowerCase());

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    normalizedAllowedRoles &&
    normalizedAllowedRoles.length > 0 &&
    (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole))
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
