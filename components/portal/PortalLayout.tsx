import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Heart,
  MessageSquare,
  Menu,
  Bell,
  LogOut,
  Moon,
  Sun,
  Calendar,
  ClipboardList,
  User,
  Calculator,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useClientNotificationCount } from '../../hooks/portal/useClientNotifications';
import { useClientUnreadCount } from '../../hooks/portal/useClientMessages';
import { ToastContainer } from '../shared/Toast';
import ErrorBoundary from '../ErrorBoundary';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../lib/i18n/LanguageContext';

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  labelKey: string;
  end?: boolean;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { to: '/portal', icon: LayoutDashboard, labelKey: 'portal.nav.home', end: true },
  { to: '/portal/search', icon: Search, labelKey: 'portal.nav.search' },
  { to: '/portal/favorites', icon: Heart, labelKey: 'portal.nav.favorites' },
  { to: '/portal/messages', icon: MessageSquare, labelKey: 'portal.nav.messages', badge: 'messages' },
];

const moreNavItems: NavItem[] = [
  { to: '/portal/transaction', icon: ClipboardList, labelKey: 'portal.nav.transaction' },
  { to: '/portal/showings', icon: Calendar, labelKey: 'portal.nav.showings' },
  { to: '/portal/home-value', icon: TrendingUp, labelKey: 'portal.nav.homeValue' },
  { to: '/portal/calculator', icon: Calculator, labelKey: 'portal.nav.calculator' },
  { to: '/portal/profile', icon: User, labelKey: 'portal.nav.profile' },
];

const allNavItems = [...mainNavItems, ...moreNavItems];

const linkClass = (isActive: boolean) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg font-lato text-sm transition-colors min-h-[44px] ${
    isActive
      ? 'text-dashboard-gold bg-white/5'
      : 'text-dashboard-secondary hover:text-white hover:bg-white/5'
  }`;

export function PortalLayout() {
  const { signOut, profile } = useAuth();
  const { data: notifCount } = useClientNotificationCount();
  const { data: unreadMessages } = useClientUnreadCount();
  const [moreOpen, setMoreOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const badges: Record<string, number> = {
    messages: unreadMessages ?? 0,
  };

  return (
    <div className="min-h-screen bg-dashboard-offwhite">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-screen bg-dashboard-black fixed left-0 top-0 z-40">
        <div className="px-6 py-6 border-b border-white/10">
          <Link to="/portal" className="block">
            <h1 className="font-playfair text-lg font-bold text-white">
              Casas En El Paso
            </h1>
            <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{t('portal.nav.clientPortal')}</p>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allNavItems.map(({ to, icon: Icon, labelKey, end, badge }) => {
            const count = badge ? badges[badge] ?? 0 : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => linkClass(isActive)}
              >
                <Icon size={20} />
                <span className="flex-1">{t(labelKey)}</span>
                {count > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-dashboard-gold text-white text-[10px] font-bold flex items-center justify-center">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          {profile && (
            <p className="px-3 font-lato text-xs text-dashboard-secondary mb-3 truncate">
              {profile.full_name}
            </p>
          )}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-lato text-sm text-dashboard-secondary hover:text-white hover:bg-white/5 transition-colors w-full min-h-[44px]"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'light' ? t('portal.nav.darkMode') : t('portal.nav.lightMode')}</span>
          </button>
          <button
            onClick={async () => { await signOut(); window.location.href = '/portal/login'; }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-lato text-sm text-dashboard-secondary hover:text-white hover:bg-white/5 transition-colors w-full min-h-[44px]"
          >
            <LogOut size={20} />
            <span>{t('portal.nav.signOut')}</span>
          </button>
          <p className="px-3 mt-3 font-lato text-[10px] text-white/20">Casas En El Paso TX</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 pt-3 pb-2 bg-dashboard-offwhite sticky top-0 z-30">
        <Link to="/portal" className="font-playfair text-base font-bold text-dashboard-black">
          Casas En El Paso
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/portal"
            className="relative p-2 text-dashboard-secondary hover:text-dashboard-gold transition-colors"
          >
            <Bell size={20} />
            {!!notifCount && notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-dashboard-gold text-white text-[10px] font-bold flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="lg:ml-60 min-h-screen pb-20 lg:pb-0">
        <div className="p-4 md:p-6 lg:p-8 pt-2 lg:pt-8 max-w-7xl mx-auto">
          <ErrorBoundary inline>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-dashboard-border z-40">
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map(({ to, icon: Icon, labelKey, end, badge }) => {
            const count = badge ? badges[badge] ?? 0 : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2 min-w-[56px] min-h-[44px] justify-center ${
                    isActive ? 'text-dashboard-gold' : 'text-dashboard-secondary'
                  }`
                }
              >
                <div className="relative">
                  <Icon size={20} />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-dashboard-gold text-white text-[8px] font-bold flex items-center justify-center">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
                <span className="font-lato text-[10px]">{t(labelKey)}</span>
              </NavLink>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 min-w-[56px] min-h-[44px] justify-center ${
              moreOpen ? 'text-dashboard-gold' : 'text-dashboard-secondary'
            }`}
          >
            <Menu size={20} />
            <span className="font-lato text-[10px]">{t('portal.nav.more')}</span>
          </button>
        </div>

        {/* More menu flyout */}
        {moreOpen && (
          <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-dashboard-border shadow-lg p-3 space-y-1">
            {moreNavItems.map(({ to, icon: Icon, labelKey }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg font-lato text-sm min-h-[44px] transition-colors ${
                    isActive ? 'text-dashboard-gold bg-dashboard-gold/5' : 'text-dashboard-body hover:bg-dashboard-surface'
                  }`
                }
              >
                <Icon size={18} />
                <span>{t(labelKey)}</span>
              </NavLink>
            ))}
            <button
              onClick={async () => { setMoreOpen(false); await signOut(); window.location.href = '/portal/login'; }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-lato text-sm text-red-500 hover:bg-red-50 w-full min-h-[44px] transition-colors"
            >
              <LogOut size={18} />
              <span>{t('portal.nav.signOut')}</span>
            </button>
          </div>
        )}
      </nav>

      <ToastContainer />
    </div>
  );
}
