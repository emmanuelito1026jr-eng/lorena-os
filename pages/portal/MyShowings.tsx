import { Link, useNavigate } from 'react-router-dom';
import { Calendar, X, MapPin } from 'lucide-react';
import { useClientShowings, useCancelShowing } from '../../hooks/portal/useClientShowings';
import { SkeletonList } from '../../components/shared/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { showToast } from '../../components/shared/Toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import type { ShowingStatus } from '../../lib/supabase/database.types';

const statusStyles: Record<ShowingStatus, { bg: string; text: string; labelKey: string }> = {
  scheduled: { bg: 'bg-gray-100', text: 'text-gray-700', labelKey: 'portal.showings.statusRequested' },
  confirmed: { bg: 'bg-dashboard-gold/10', text: 'text-dashboard-gold', labelKey: 'portal.showings.statusConfirmed' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', labelKey: 'portal.showings.statusCompleted' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', labelKey: 'portal.showings.statusCancelled' },
  no_show: { bg: 'bg-red-50', text: 'text-red-600', labelKey: 'portal.showings.statusNoShow' },
};

export default function MyShowings() {
  usePageTitle('My Showings');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: showings = [], isLoading } = useClientShowings();
  const cancelShowing = useCancelShowing();

  const upcoming = showings.filter(s => s.status !== 'cancelled' && s.status !== 'completed' && s.status !== 'no_show');
  const past = showings.filter(s => s.status === 'completed' || s.status === 'cancelled' || s.status === 'no_show');

  const handleCancel = (id: string) => {
    cancelShowing.mutate(id, {
      onSuccess: () => showToast('Showing cancelled'),
      onError: () => showToast('Failed to cancel', 'error'),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-dashboard-border rounded animate-pulse w-32" />
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('portal.showings.title')}</h1>
          <p className="font-lato text-sm text-dashboard-secondary mt-1">{upcoming.length} {t('portal.showings.upcoming')}</p>
        </div>
        <Link
          to="/portal/favorites"
          className="px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-xs rounded-lg transition-colors min-h-[44px] flex items-center gap-1.5"
        >
          <Calendar size={14} />
          {t('portal.showings.requestShowing')}
        </Link>
      </div>

      {showings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t('portal.showings.emptyTitle')}
          description={t('portal.showings.emptyDesc')}
          actionLabel={t('portal.home.browseHomes')}
          onAction={() => { navigate('/portal/search'); }}
        />
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="font-playfair text-lg font-bold text-dashboard-black mb-3">{t('portal.showings.upcomingSection')}</h2>
              <div className="space-y-3">
                {upcoming.map(showing => {
                  const style = statusStyles[showing.status];
                  return (
                    <div key={showing.id} className="bg-white rounded-xl border border-dashboard-border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-lato text-sm font-medium text-dashboard-black flex items-center gap-1.5">
                            <MapPin size={14} className="text-dashboard-gold flex-shrink-0" />
                            <span className="truncate">{showing.address}</span>
                          </p>
                          <p className="font-lato text-xs text-dashboard-secondary mt-1">
                            {new Date(showing.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' · '}{showing.start_time} — {showing.end_time}
                          </p>
                          {showing.notes && (
                            <p className="font-lato text-xs text-dashboard-secondary mt-1">{showing.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
                            {t(style.labelKey)}
                          </span>
                          {(showing.status === 'scheduled' || showing.status === 'confirmed') && (
                            <button
                              onClick={() => handleCancel(showing.id)}
                              disabled={cancelShowing.isPending}
                              className="p-1.5 text-dashboard-secondary hover:text-red-500 min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title={t('portal.showings.cancelShowing')}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="font-playfair text-lg font-bold text-dashboard-black mb-3">{t('portal.showings.pastShowings')}</h2>
              <div className="space-y-2">
                {past.map(showing => {
                  const style = statusStyles[showing.status];
                  return (
                    <div key={showing.id} className="bg-white rounded-xl border border-dashboard-border p-4 opacity-70">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-lato text-sm text-dashboard-body truncate">{showing.address}</p>
                          <p className="font-lato text-xs text-dashboard-secondary">
                            {new Date(showing.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
                          {t(style.labelKey)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
