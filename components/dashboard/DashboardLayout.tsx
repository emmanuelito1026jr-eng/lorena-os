import { Outlet, Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { QuickActionFAB } from './QuickActionFAB';
import { ToastContainer } from '../shared/Toast';
import { ConfirmDialogContainer } from '../shared/ConfirmDialog';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import ErrorBoundary from '../ErrorBoundary';

function DashboardInner() {
  const { data: notifCount } = useUnreadNotificationCount();

  return (
    <div id="dashboard-root" className="min-h-screen bg-dashboard-offwhite">
      <Sidebar />

      {/* Main content area */}
      <main className="lg:ml-60 min-h-screen pb-20 lg:pb-0">
        {/* Top bar with notification bell (visible on mobile) */}
        <div className="flex items-center justify-end px-4 pt-3 lg:hidden">
          <Link to="/dashboard" aria-label={`Notifications${notifCount ? ` (${notifCount} unread)` : ''}`} className="relative p-2 text-dashboard-secondary hover:text-dashboard-gold transition-colors">
            <Bell size={20} />
            {!!notifCount && notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-dashboard-gold text-white text-[10px] font-lato font-bold flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
        </div>
        <div className="p-4 md:p-6 lg:p-8 pt-2 lg:pt-8 max-w-7xl mx-auto">
          <ErrorBoundary inline>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      <BottomNav />
      <QuickActionFAB />
      <ToastContainer />
      <ConfirmDialogContainer />
    </div>
  );
}

export function DashboardLayout() {
  return <DashboardInner />;
}
