import { Navigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { ReactNode } from 'react';
import { getFirstAvailablePage } from '@/app/utils/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
}

export default function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  // Always call hooks at the top level
  const { currentUser } = useApp();

  // If no current user, redirect to login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // If user is admin, grant access to all routes
  if (currentUser.role === 'admin') {
    return <>{children}</>;
  }

  // If no specific permission is required, allow access
  if (!permission) {
    return <>{children}</>;
  }

  // Check if user has the required permission
  const hasPermission = currentUser.permissions?.[permission as keyof typeof currentUser.permissions];

  if (!hasPermission) {
    // Redirect to first available page instead of showing error
    const firstAvailablePage = getFirstAvailablePage(currentUser);
    return <Navigate to={firstAvailablePage} replace />;
  }

  return <>{children}</>;
}