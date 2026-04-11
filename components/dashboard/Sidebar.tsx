import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  DollarSign,
  TrendingUp,
  Moon,
  Sun,
  Bot,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadCount, useChatUnreadCount } from '../../hooks/useMessages';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../lib/i18n/LanguageContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Command Center', end: true, badgeKey: 'notifications' as const },
  { to: '/dashboard/leads', icon: Users, label: 'Leads' },
  { to: '/dashboard/deals', icon: DollarSign, label: 'Deals' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages', badgeKey: 'messages' as const },
  { to: '/dashboard/showings', icon: Calendar, label: 'Showings' },
  { to: '/dashboard/market', icon: TrendingUp, label: 'HomePulse' },
  { to: '/dashboard/cma', icon: FileText, label: 'CMA' },
  { to: '/dashboard/autotracks', icon: Zap, label: 'AutoTracks' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/ai-team', icon: Bot, label: 'AI Staff', highlight: true },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { signOut, profile } = useAuth();
  const { data: unreadMessages } = useUnreadCount();
  const { data: chatUnread } = useChatUnreadCount();
  const { data: unreadNotifications } = useUnreadNotificationCount();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const badges: Record<string, number> = {
    messages: (unreadMessages ?? 0) + (chatUnread ?? 0),
    notifications: unreadNotifications ?? 0,
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen bg-dashboard-black fixed left-0 top-0 z-40">
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="font-playfair text-lg font-bold text-white">Casas En El Paso</h1>
        <p className="font-lato text-xs text-dashboard-secondary mt-0.5">TX</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end, badgeKey, highlight }) => {
          const count = badgeKey ? badges[badgeKey] : 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={count > 0 ? `${label} (${count} unread)` : label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-lato text-sm transition-colors min-h-[44px] ${
                  isActive
                    ? 'text-dashboard-gold bg-white/5'
                    : highlight
                    ? 'text-dashboard-gold/80 hover:text-dashboard-gold hover:bg-dashboard-gold/10'
                    : 'text-dashboard-secondary hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={20} />
              <span className="flex-1">{label}</span>
              {highlight && (
                <span className="text-[9px] font-bold bg-dashboard-gold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">AI</span>
              )}
              {count > 0 && (
                <span aria-hidden="true" className="min-w-[20px] h-5 px-1.5 rounded-full bg-dashboard-gold text-white text-[10px] font-bold flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        {profile && <p className="px-3 font-lato text-xs text-dashboard-secondary mb-3 truncate">{profile.full_name}</p>}
        <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-lato text-sm text-dashboard-secondary hover:text-white hover:bg-white/5 transition-colors w-full min-h-[44px]" aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? t('nav.darkMode') : t('nav.lightMode')}</span>
        </button>
        <button onClick={async () => { await signOut(); window.location.href = '/login'; }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-lato text-sm text-dashboard-secondary hover:text-white hover:bg-white/5 transition-colors w-full min-h-[44px]">
          <LogOut size={20} />
          <span>{t('nav.signOut')}</span>
        </button>
      </div>
    </aside>
  );
}