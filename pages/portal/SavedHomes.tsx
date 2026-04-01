import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Calendar, Trash2, MapPin } from 'lucide-react';
import { useClientFavorites, useToggleFavorite } from '../../hooks/portal/useClientListings';
import { useRequestShowing } from '../../hooks/portal/useClientShowings';
import { SkeletonPropertyGrid } from '../../components/shared/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal, inputClass } from '../../components/shared/Modal';
import { showToast } from '../../components/shared/Toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';

export default function SavedHomes() {
  usePageTitle('Saved Homes');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: favorites = [], isLoading } = useClientFavorites();
  const toggleFav = useToggleFavorite();
  const requestShowing = useRequestShowing();
  const [showingModal, setShowingModal] = useState<{ address: string } | null>(null);
  const [showingDate, setShowingDate] = useState('');
  const [showingTime, setShowingTime] = useState('10:00');

  const handleRequestShowing = () => {
    if (!showingModal || !showingDate) return;
    requestShowing.mutate({
      address: showingModal.address,
      date: showingDate,
      startTime: showingTime,
      endTime: `${parseInt(showingTime) + 1}:00`,
    }, {
      onSuccess: () => {
        showToast('Showing requested — Lorena will confirm shortly');
        setShowingModal(null);
        setShowingDate('');
      },
      onError: () => showToast('Failed to request showing', 'error'),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-dashboard-border rounded animate-pulse w-48" />
        <SkeletonPropertyGrid count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('portal.savedHomes.title')}</h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">{favorites.length} {t('portal.savedHomes.homesSaved')}</p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t('portal.savedHomes.emptyTitle')}
          description={t('portal.savedHomes.emptyDesc')}
          actionLabel={t('portal.home.browseHomes')}
          onAction={() => { navigate('/portal/search'); }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map(listing => (
            <div key={listing.id} className="bg-white rounded-xl border border-dashboard-border overflow-hidden">
              <Link to={`/property/${listing.id}`} className="block">
                <div className="h-44 bg-dashboard-surface">
                  {listing.images[0] && (
                    <img src={listing.images[0]} alt={listing.address} className="w-full h-full object-cover" width={800} height={600} loading="lazy" />
                  )}
                </div>
              </Link>
              <div className="p-4">
                <p className="font-playfair text-lg font-bold text-dashboard-gold">${listing.price.toLocaleString()}</p>
                <p className="font-lato text-sm text-dashboard-body truncate mt-0.5 flex items-center gap-1">
                  <MapPin size={12} className="flex-shrink-0" />
                  {listing.address}
                </p>
                <p className="font-lato text-xs text-dashboard-secondary mt-0.5">
                  {listing.beds} bd · {listing.baths} ba · {listing.sqft?.toLocaleString()} sqft
                </p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dashboard-border">
                  <button
                    onClick={() => setShowingModal({ address: listing.address })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato text-xs rounded-lg transition-colors min-h-[36px]"
                  >
                    <Calendar size={12} />
                    {t('portal.savedHomes.scheduleShowing')}
                  </button>
                  <button
                    onClick={() => toggleFav.mutate({ listingId: listing.id, isFavorited: true }, {
                      onSuccess: () => showToast('Removed from favorites'),
                      onError: () => showToast('Failed to remove from favorites', 'error'),
                    })}
                    className="p-1.5 text-red-400 hover:text-red-600 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule showing modal */}
      <Modal isOpen={!!showingModal} onClose={() => setShowingModal(null)} title={t('portal.savedHomes.scheduleShowingTitle')}>
        <div className="space-y-4">
          <p className="font-lato text-sm text-dashboard-body">{showingModal?.address}</p>
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('portal.savedHomes.preferredDate')}</label>
            <input
              type="date"
              value={showingDate}
              onChange={e => setShowingDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={inputClass}
            />
          </div>
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('portal.savedHomes.preferredTime')}</label>
            <select value={showingTime} onChange={e => setShowingTime(e.target.value)} className={inputClass}>
              {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRequestShowing}
            disabled={!showingDate || requestShowing.isPending}
            className="w-full py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg min-h-[44px]"
          >
            {requestShowing.isPending ? t('portal.savedHomes.requesting') : t('portal.savedHomes.requestShowing')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
