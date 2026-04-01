import { Link } from 'react-router-dom';
import { Heart, Calendar, MessageSquare, Search, Home, ArrowRight } from 'lucide-react';
import { useClientProfile, useClientLeadRecord } from '../../hooks/portal/useClientProfile';
import { useClientFavorites } from '../../hooks/portal/useClientListings';
import { useClientShowings } from '../../hooks/portal/useClientShowings';
import { useClientUnreadCount } from '../../hooks/portal/useClientMessages';
import { useClientTransaction, DEAL_STAGES } from '../../hooks/portal/useClientTransaction';
import { SkeletonStats, SkeletonCard } from '../../components/shared/Skeleton';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';

export default function PortalHome() {
  usePageTitle('My Portal');
  const { t } = useTranslation();

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return t('portal.home.goodMorning');
    if (h < 17) return t('portal.home.goodAfternoon');
    return t('portal.home.goodEvening');
  }
  const { data: profile, isLoading: profileLoading } = useClientProfile();
  const { data: lead } = useClientLeadRecord();
  const { data: favorites = [], isLoading: favsLoading } = useClientFavorites();
  const { data: showings = [] } = useClientShowings();
  const { data: unread = 0 } = useClientUnreadCount();
  const { data: deal } = useClientTransaction();

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const upcomingShowings = showings.filter(
    s => s.status !== 'cancelled' && s.status !== 'completed' && new Date(s.date) >= new Date(new Date().toDateString())
  );

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-dashboard-border rounded-xl animate-pulse" />
        <SkeletonStats count={3} />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">
          {getGreeting()}, {firstName}
        </h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Transaction status */}
      {deal && (
        <div className="bg-white rounded-xl border border-dashboard-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('portal.home.yourTransaction')}</h2>
            <Link to="/portal/transaction" className="font-lato text-xs text-dashboard-gold hover:underline flex items-center gap-1">
              {t('portal.home.viewDetails')} <ArrowRight size={12} />
            </Link>
          </div>
          {deal.property_address && (
            <p className="font-lato text-sm text-dashboard-body mb-3">{deal.property_address}</p>
          )}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {DEAL_STAGES.map((stage, i) => {
              const currentIdx = DEAL_STAGES.findIndex(s => s.key === deal.stage);
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={stage.key} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent ? 'bg-dashboard-gold text-white' : isPast ? 'bg-green-500 text-white' : 'bg-dashboard-border text-dashboard-secondary'
                  }`}>
                    {isPast ? '✓' : i + 1}
                  </div>
                  <span className={`font-lato text-[10px] whitespace-nowrap ${isCurrent ? 'text-dashboard-gold font-medium' : 'text-dashboard-secondary'}`}>
                    {stage.label}
                  </span>
                  {i < DEAL_STAGES.length - 1 && <div className={`w-4 h-px ${isPast ? 'bg-green-500' : 'bg-dashboard-border'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Link to="/portal/favorites" className="bg-white rounded-xl border border-dashboard-border p-4 hover:border-dashboard-gold/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={16} className="text-dashboard-gold" />
            <span className="font-lato text-xs text-dashboard-secondary">{t('portal.home.saved')}</span>
          </div>
          <p className="font-playfair text-2xl font-bold text-dashboard-black">{favorites.length}</p>
        </Link>
        <Link to="/portal/showings" className="bg-white rounded-xl border border-dashboard-border p-4 hover:border-dashboard-gold/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-dashboard-gold" />
            <span className="font-lato text-xs text-dashboard-secondary">{t('portal.home.showings')}</span>
          </div>
          <p className="font-playfair text-2xl font-bold text-dashboard-black">{upcomingShowings.length}</p>
        </Link>
        <Link to="/portal/messages" className="bg-white rounded-xl border border-dashboard-border p-4 hover:border-dashboard-gold/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-dashboard-gold" />
            <span className="font-lato text-xs text-dashboard-secondary">{t('portal.home.unread')}</span>
          </div>
          <p className="font-playfair text-2xl font-bold text-dashboard-black">{unread}</p>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/portal/search"
          className="flex items-center gap-3 bg-white rounded-xl border border-dashboard-border p-4 hover:border-dashboard-gold/30 transition-colors min-h-[44px]"
        >
          <Search size={20} className="text-dashboard-gold" />
          <span className="font-lato text-sm font-medium text-dashboard-black">{t('portal.home.browseHomes')}</span>
        </Link>
        <Link
          to="/portal/messages"
          className="flex items-center gap-3 bg-white rounded-xl border border-dashboard-border p-4 hover:border-dashboard-gold/30 transition-colors min-h-[44px]"
        >
          <MessageSquare size={20} className="text-dashboard-gold" />
          <span className="font-lato text-sm font-medium text-dashboard-black">{t('portal.home.messageLorena')}</span>
        </Link>
        <Link
          to="/portal/home-value"
          className="flex items-center gap-3 bg-white rounded-xl border border-dashboard-border p-4 hover:border-dashboard-gold/30 transition-colors min-h-[44px]"
        >
          <Home size={20} className="text-dashboard-gold" />
          <span className="font-lato text-sm font-medium text-dashboard-black">{t('portal.home.homeValue')}</span>
        </Link>
      </div>

      {/* Saved homes preview */}
      {!favsLoading && favorites.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('portal.home.savedHomes')}</h2>
            <Link to="/portal/favorites" className="font-lato text-xs text-dashboard-gold hover:underline">
              {t('portal.home.viewAll')} ({favorites.length})
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {favorites.slice(0, 3).map(listing => (
              <div key={listing.id} className="bg-white rounded-xl border border-dashboard-border overflow-hidden">
                <div className="h-32 bg-dashboard-surface">
                  {listing.images[0] && (
                    <img src={listing.images[0]} alt={listing.address} className="w-full h-full object-cover" width={800} height={600} loading="lazy" />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-playfair text-sm font-bold text-dashboard-gold">${listing.price.toLocaleString()}</p>
                  <p className="font-lato text-xs text-dashboard-body truncate mt-0.5">{listing.address}</p>
                  <p className="font-lato text-xs text-dashboard-secondary mt-0.5">
                    {listing.beds} bd · {listing.baths} ba · {listing.sqft?.toLocaleString()} sqft
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No transaction CTA */}
      {!deal && !lead && (
        <div className="bg-gradient-to-br from-dashboard-gold/10 to-dashboard-gold/5 rounded-xl border border-dashboard-gold/20 p-6 text-center">
          <Home size={32} className="text-dashboard-gold mx-auto mb-3" />
          <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-2">
            {t('portal.home.startJourneyTitle')}
          </h3>
          <p className="font-lato text-sm text-dashboard-secondary mb-4 max-w-md mx-auto">
            {t('portal.home.startJourneyDesc')}
          </p>
          <Link
            to="/portal/search"
            className="inline-block px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {t('portal.home.browseHomes')}
          </Link>
        </div>
      )}
    </div>
  );
}
