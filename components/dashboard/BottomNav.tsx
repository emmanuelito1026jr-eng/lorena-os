import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  MoreHorizontal,
  FileText,
  Zap,
  BarChart3,
  Settings,
  X,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useUnreadCount, useChatUnreadCount } from '../../hooks/useMessages';

const primaryTabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/dashboard/leads', icon: Users, label: 'Leads' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages', badgeKey: 'messages' as const },
  { to: '/dashboard/showings', icon: Calendar, label: 'Showings' },
];

const moreItems = [
  { to: '/dashboard/deals', icon: DollarSign, label: 'Deals' },
  { to: '/dashboard/market', icon: TrendingUp, label: 'HomePulse' },
  { to: '/dashboard/cma', icon: FileText, label: 'CMA Generator' },
  { to: '/dashboard/autotracks', icon: Zap, label: 'AutoTracks' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();
  const { data: unreadMessages } = useUnreadCount();
  const { data: chatUnread } = useChatUnreadCount();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showMore && panelRef.current) {
      const firstBtn = panelRef.current.querySelector<HTMLElement>('button');
      firstBtn?.focus();
    }
  }, [showMore]);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMore(false)}
          />
          <div ref={panelRef} role="dialog" aria-modal="true" aria-label="More navigation options" className="absolute bottom-16 left-0 right-0 bg-white border-t border-dashboard-border rounded-t-2xl shadow-premium-lg p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-playfair text-lg font-semibold text-dashboard-black">
                More
              </h3>
              <button
                onClick={() => setShowMore(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-dashboard-secondary"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-1">
              {moreItems.map(({ to, icon: Icon, label }) => (
                <button
                  key={to}
                  onClick={() => {
                    navigate(to);
                    setShowMore(false);
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg font-lato text-sm text-dashboard-body hover:bg-dashboard-surface transition-colors w-full min-h-[44px]"
                >
                  <Icon size={20} className="text-dashboard-secondary" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-dashboard-border z-40 lg:hidden">
        <div className="flex items-center justify-around h-full px-2">
          {primaryTabs.map(({ to, icon: Icon, label, end, badgeKey }) => {
            const count = badgeKey === 'messages' ? (unreadMessages ?? 0) + (chatUnread ?? 0) : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={count > 0 ? `${label} (${count} unread)` : label}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 font-lato transition-colors relative ${
                    isActive
                      ? 'text-dashboard-gold'
                      : 'text-dashboard-secondary'
                  }`
                }
              >
                <div className="relative">
                  <Icon size={22} />
                  {count > 0 && (
                    <span aria-hidden="true" className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-dashboard-gold text-white text-[9px] font-bold flex items-center justify-center">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </NavLink>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            aria-expanded={showMore}
            aria-haspopup="dialog"
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 font-lato transition-colors ${
              showMore ? 'text-dashboard-gold' : 'text-dashboard-secondary'
            }`}
          >
            <MoreHorizontal size={22} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
