import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function PortalRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, isAgent } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dashboard-offwhite flex items-center justify-center">
        <div className="space-y-4 w-64">
          <div className="h-8 bg-dashboard-border rounded animate-pulse" />
          <div className="h-4 bg-dashboard-border rounded animate-pulse w-3/4" />
          <div className="h-4 bg-dashboard-border rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/portal/login" replace />;
  }

  // Agents go to dashboard, not portal
  if (isAgent) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
