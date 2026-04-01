import { useState, useMemo } from 'react';
import { Calendar, MapPin, User, Clock, Plus, ChevronLeft, ChevronRight, Trash2, Pencil, CheckCircle, Star } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonList } from '../../components/shared/Skeleton';
import { AddShowingModal } from '../../components/dashboard/modals/AddShowingModal';
import { PostShowingModal } from '../../components/dashboard/modals/PostShowingModal';
import { showToast } from '../../components/shared/Toast';
import { confirmAction } from '../../components/shared/ConfirmDialog';
import { useShowings, useDeleteShowing } from '../../hooks/useShowings';
import { useRealtimeShowings } from '../../hooks/useRealtime';
import type { Tables, ShowingWithLead } from '../../lib/supabase/database.types';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isToday, isTomorrow, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';

type ViewMode = 'list' | 'week' | 'month';

export default function Showings() {
  usePageTitle('Showings');
  useRealtimeShowings();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShowing, setEditingShowing] = useState<Tables<'showings'> | null>(null);
  const [feedbackShowing, setFeedbackShowing] = useState<{ id: string; leadId: string; leadName: string; address: string } | null>(null);
  const deleteShowing = useDeleteShowing();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: showings, isLoading } = useShowings(
    viewMode === 'week' ? { start: format(weekStart, 'yyyy-MM-dd'), end: format(weekEnd, 'yyyy-MM-dd') }
    : viewMode === 'month' ? { start: format(monthStart, 'yyyy-MM-dd'), end: format(monthEnd, 'yyyy-MM-dd') }
    : undefined
  );

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    scheduled: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    no_show: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  // Group showings by date for list view
  const groupedShowings = useMemo(() => {
    if (!showings?.length) return [];
    const groups = new Map<string, typeof showings>();
    for (const s of showings) {
      const arr = groups.get(s.date) ?? [];
      arr.push(s);
      groups.set(s.date, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [showings]);

  // Calendar days for month view
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const navigate = (dir: number) => {
    if (viewMode === 'week') setCurrentDate(dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('showings.title')}</h1>
          <p className="font-lato text-sm text-dashboard-secondary mt-1">
            {showings?.length ?? 0} {t('showings.showingsCount')}{viewMode !== 'list' ? ` ${viewMode === 'week' ? t('showings.thisWeek') : t('showings.thisMonth')}` : ''}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px] flex items-center gap-1.5">
          <Plus size={16} /> {t('showings.newShowing')}
        </button>
      </div>

      {/* View Mode + Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex border border-dashboard-border rounded-lg overflow-hidden">
          {(['list', 'week', 'month'] as ViewMode[]).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-2 font-lato text-xs capitalize min-h-[36px] ${viewMode === mode ? 'bg-dashboard-gold text-white' : 'text-dashboard-secondary hover:bg-dashboard-surface'}`}>
              {mode === 'list' ? t('showings.listView') : mode === 'week' ? t('showings.weekView') : t('showings.monthView')}
            </button>
          ))}
        </div>
        {viewMode !== 'list' && (
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} aria-label={`Previous ${viewMode}`} className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg border border-dashboard-border flex items-center justify-center text-dashboard-secondary hover:text-dashboard-body">
              <ChevronLeft size={16} />
            </button>
            <span className="font-lato text-sm font-medium text-dashboard-black min-w-[140px] text-center">
              {viewMode === 'week' ? `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}` : format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={() => navigate(1)} aria-label={`Next ${viewMode}`} className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg border border-dashboard-border flex items-center justify-center text-dashboard-secondary hover:text-dashboard-body">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : !showings?.length ? (
        <EmptyState icon={Calendar} title={t('showings.noShowings')} description={t('showings.noShowingsDesc')} />
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="space-y-4">
          {groupedShowings.map(([date, dayShowings]) => {
            const d = parseISO(date);
            const label = isToday(d) ? t('showings.today') : isTomorrow(d) ? t('showings.tomorrow') : format(d, 'EEEE, MMM d');
            return (
              <div key={date}>
                <h3 className="font-lato text-xs font-medium text-dashboard-secondary uppercase tracking-wider mb-2">{label}</h3>
                <div className="bg-white rounded-xl border border-dashboard-border divide-y divide-dashboard-border">
                  {dayShowings.map((showing) => {
                    const leadData = (showing as ShowingWithLead).leads;
                    return (
                      <div key={showing.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-dashboard-secondary shrink-0" />
                              <span className="font-lato text-sm font-medium text-dashboard-black">
                                {showing.start_time.slice(0, 5)} - {showing.end_time.slice(0, 5)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <MapPin size={14} className="text-dashboard-secondary shrink-0" />
                              <span className="font-lato text-sm text-dashboard-body truncate">{showing.address}</span>
                            </div>
                            {leadData && (
                              <div className="flex items-center gap-2 mt-1">
                                <User size={14} className="text-dashboard-secondary shrink-0" />
                                <span className="font-lato text-sm text-dashboard-secondary">{leadData.first_name} {leadData.last_name}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-lato font-medium border ${statusColors[showing.status] || statusColors.scheduled}`}>
                              {showing.status}
                            </span>
                            {(showing.feedback as Record<string, unknown> | null)?.rating && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-lato font-medium bg-dashboard-gold/10 text-dashboard-gold">
                                <Star size={10} className="fill-dashboard-gold" /> {String((showing.feedback as Record<string, unknown>).rating)}
                              </span>
                            )}
                            {(showing.status === 'confirmed' || showing.status === 'scheduled') && (
                              <button
                                onClick={() => {
                                  const ld = (showing as ShowingWithLead).leads;
                                  setFeedbackShowing({
                                    id: showing.id,
                                    leadId: showing.lead_id,
                                    leadName: ld ? `${ld.first_name} ${ld.last_name}` : t('showings.unknownLead'),
                                    address: showing.address,
                                  });
                                }}
                                aria-label={t('showings.markComplete')}
                                className="text-dashboard-secondary hover:text-green-600 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title={t('showings.markComplete')}
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button onClick={() => setEditingShowing(showing)} aria-label={`Edit showing at ${showing.address}`} className="text-dashboard-secondary hover:text-dashboard-gold transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => confirmAction(t('showings.confirmDelete'), () => deleteShowing.mutate(showing.id, { onSuccess: () => showToast(t('showings.deleted')), onError: () => showToast(t('showings.deleteFailed'), 'error') }))} aria-label="Delete showing" className="text-dashboard-secondary hover:text-red-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'month' ? (
        /* Month View */
        <div className="bg-white rounded-xl border border-dashboard-border overflow-hidden">
          <div className="grid grid-cols-7 border-b border-dashboard-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-2 text-center font-lato text-xs text-dashboard-secondary font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayShowings = showings.filter(s => s.date === dayStr);
              return (
                <div key={dayStr} className={`min-h-[80px] p-1.5 border-b border-r border-dashboard-border ${!isSameMonth(day, currentDate) ? 'bg-dashboard-surface/30' : ''}`}>
                  <span className={`font-lato text-xs ${isToday(day) ? 'w-6 h-6 rounded-full bg-dashboard-gold text-white flex items-center justify-center' : 'text-dashboard-secondary'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayShowings.slice(0, 2).map(s => (
                    <div key={s.id} className={`mt-1 px-1 py-0.5 rounded text-[10px] font-lato truncate ${statusColors[s.status] || 'bg-gray-50 text-gray-600'}`}>
                      {s.start_time.slice(0, 5)} {s.address.split(',')[0]}
                    </div>
                  ))}
                  {dayShowings.length > 2 && (
                    <p className="mt-0.5 font-lato text-[10px] text-dashboard-secondary">+{dayShowings.length - 2} {t('showings.more')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View */
        <div className="bg-white rounded-xl border border-dashboard-border overflow-hidden">
          {eachDayOfInterval({ start: weekStart, end: weekEnd }).map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayShowings = showings.filter(s => s.date === dayStr);
            return (
              <div key={dayStr} className="border-b border-dashboard-border last:border-b-0">
                <div className={`px-4 py-2 ${isToday(day) ? 'bg-dashboard-gold/5' : 'bg-dashboard-surface/30'}`}>
                  <span className={`font-lato text-sm font-medium ${isToday(day) ? 'text-dashboard-gold' : 'text-dashboard-black'}`}>
                    {format(day, 'EEE, MMM d')}
                  </span>
                  {dayShowings.length > 0 && <span className="font-lato text-xs text-dashboard-secondary ml-2">({dayShowings.length})</span>}
                </div>
                {dayShowings.length > 0 && (
                  <div className="divide-y divide-dashboard-border/50">
                    {dayShowings.map(s => {
                      const leadData = (s as ShowingWithLead).leads;
                      return (
                        <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                          <span className="font-lato text-xs text-dashboard-secondary w-24 shrink-0">{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-lato text-sm text-dashboard-body truncate">{s.address}</p>
                            {leadData && <p className="font-lato text-xs text-dashboard-secondary">{leadData.first_name} {leadData.last_name}</p>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-lato font-medium ${statusColors[s.status] || statusColors.scheduled}`}>{s.status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AddShowingModal isOpen={showAddModal || !!editingShowing} onClose={() => { setShowAddModal(false); setEditingShowing(null); }} editItem={editingShowing} />
      {feedbackShowing && (
        <PostShowingModal
          isOpen={!!feedbackShowing}
          onClose={() => setFeedbackShowing(null)}
          showingId={feedbackShowing.id}
          leadId={feedbackShowing.leadId}
          leadName={feedbackShowing.leadName}
          address={feedbackShowing.address}
        />
      )}
    </div>
  );
}
