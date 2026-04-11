import { useState, useMemo, useDeferredValue, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Filter, Plus, Phone, Trash2, Flame, TrendingUp, UserPlus, Zap, CheckSquare, X, Shield } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonList } from '../../components/shared/Skeleton';
import { LeadScoreBadge } from '../../components/shared/LeadScoreBadge';
import { AddLeadModal } from '../../components/dashboard/modals/AddLeadModal';
import { showToast } from '../../components/shared/Toast';
import { confirmAction } from '../../components/shared/ConfirmDialog';
import { useLeads, useUpdateLead } from '../../hooks/useLeads';
import { useRealtimeLeads } from '../../hooks/useRealtime';
import type { LeadTemperature, LeadStatus } from '../../lib/supabase/database.types';
import { HOT_THRESHOLD, WARM_THRESHOLD, COOL_THRESHOLD } from '../../lib/scoring/constants';
import { format, differenceInDays } from 'date-fns';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import { supabase } from '../../lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'list' | 'pipeline';
type SortField = 'score' | 'last_activity' | 'created_at' | 'first_name';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new_lead', label: 'New Lead' },
  { value: 'attempted_contact', label: 'Attempted Contact' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'appointment_set', label: 'Appointment Set' },
  { value: 'appointment_met', label: 'Appointment Met' },
  { value: 'active_client', label: 'Active Client' },
  { value: 'pending_client', label: 'Pending Client' },
  { value: 'past_client', label: 'Past Client' },
  { value: 'lost', label: 'Lost' },
];

const TEMP_TAB_KEYS: { value: LeadTemperature | 'all'; i18nKey: string; color: string }[] = [
  { value: 'all', i18nKey: 'leads.all', color: 'text-dashboard-body' },
  { value: 'hot', i18nKey: 'leads.hot', color: 'text-score-hot' },
  { value: 'warm', i18nKey: 'leads.warm', color: 'text-score-warm' },
  { value: 'cool', i18nKey: 'leads.cool', color: 'text-score-cool' },
  { value: 'cold', i18nKey: 'leads.cold', color: 'text-score-cold' },
];

export default function Leads() {
  usePageTitle('Leads');
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [tempFilter, setTempFilter] = useState<LeadTemperature | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [sortBy, setSortBy] = useState<SortField>('score');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const updateLead = useUpdateLead();
  const queryClient = useQueryClient();

  const deferredSearch = useDeferredValue(search);

  const { data: leads, isLoading, error } = useLeads({
    temperature: tempFilter === 'all' ? undefined : tempFilter,
    status: statusFilter || undefined,
    search: deferredSearch || undefined,
    sortBy,
    sortOrder: 'desc',
  });

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!leads) return;
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  }, [leads, selectedIds.size]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const CLOSING_STATUSES: LeadStatus[] = ['past_client', 'lost'];

  const bulkChangeStatus = useCallback(async (status: LeadStatus) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setBulkLoading(true);

    // If moving to a closing status, cancel active drip enrollments first
    if (CLOSING_STATUSES.includes(status)) {
      await supabase
        .from('drip_enrollments')
        .update({ status: 'paused' })
        .in('lead_id', ids)
        .eq('status', 'active');
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({ status })
      .in('id', ids);
    setBulkLoading(false);
    if (updateError) {
      showToast(t('leads.bulkUpdateFailed'), 'error');
    } else {
      showToast(t('leads.bulkUpdated').replace('{count}', String(selectedIds.size)));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  }, [selectedIds, queryClient, t]);

  const bulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    confirmAction(t('leads.bulkDeleteConfirm').replace('{count}', String(selectedIds.size)), async () => {
      setBulkLoading(true);
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .in('id', Array.from(selectedIds));
      setBulkLoading(false);
      if (deleteError) {
        showToast(t('leads.bulkDeleteFailed'), 'error');
      } else {
        showToast(t('leads.bulkDeleted').replace('{count}', String(selectedIds.size)));
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      }
    });
  }, [selectedIds, queryClient, t]);

  useRealtimeLeads();

  const tempCounts = useMemo(() => {
    if (!leads) return { all: 0, hot: 0, warm: 0, cool: 0, cold: 0 };
    return {
      all: leads.length,
      hot: leads.filter(l => l.score >= HOT_THRESHOLD).length,
      warm: leads.filter(l => l.score >= WARM_THRESHOLD && l.score < HOT_THRESHOLD).length,
      cool: leads.filter(l => l.score >= COOL_THRESHOLD && l.score < WARM_THRESHOLD).length,
      cold: leads.filter(l => l.score < COOL_THRESHOLD).length,
    };
  }, [leads]);

  const pipelineGroups = useMemo(() => {
    if (!leads) return [];
    return STATUS_OPTIONS.map(status => ({
      ...status,
      leads: leads.filter(l => l.status === status.value),
    })).filter(g => g.leads.length > 0);
  }, [leads]);

  const todayStr = new Date().toISOString().split('T')[0];
  const newToday = useMemo(() => {
    return (leads ?? []).filter(l => l.created_at >= `${todayStr}T00:00:00`).length;
  }, [leads, todayStr]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('leads.title')}</h1>
          <p className="font-lato text-sm text-dashboard-secondary mt-1">{t('leads.inPipeline').replace('{count}', String(leads?.length ?? 0))}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px] flex items-center gap-1.5">
          <Plus size={16} /> {t('leads.addLead')}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-dashboard-border p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-score-hot/10 flex items-center justify-center shrink-0">
            <Flame size={16} className="text-score-hot" />
          </div>
          <div>
            <p className="font-playfair text-lg font-bold text-dashboard-black">{tempCounts.hot}</p>
            <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">{t('leads.hot')}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-dashboard-border p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-score-warm/10 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-score-warm" />
          </div>
          <div>
            <p className="font-playfair text-lg font-bold text-dashboard-black">{tempCounts.warm}</p>
            <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">{t('leads.warm')}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-dashboard-border p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <UserPlus size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="font-playfair text-lg font-bold text-dashboard-black">{newToday}</p>
            <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">{t('leads.newToday')}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-dashboard-border p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-dashboard-teal-light flex items-center justify-center shrink-0">
            <Zap size={16} className="text-dashboard-teal" />
          </div>
          <div>
            <p className="font-playfair text-lg font-bold text-dashboard-black">{tempCounts.all}</p>
            <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">{t('leads.total')}</p>
          </div>
        </div>
      </div>

      {/* Temperature Tabs + Military shortcut */}
      <div className="flex gap-2">
        <div className="flex gap-1 bg-dashboard-surface rounded-lg p-1 flex-1">
          {TEMP_TAB_KEYS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTempFilter(tab.value)}
              className={`flex-1 py-2 px-3 rounded-md font-lato text-sm font-medium transition-colors min-h-[44px] ${
                tempFilter === tab.value ? 'bg-white shadow-sm text-dashboard-black' : 'text-dashboard-secondary hover:text-dashboard-body'
              }`}
            >
              <span className={tempFilter === tab.value ? tab.color : ''}>{t(tab.i18nKey)}</span>
              {tempFilter === 'all' && <span className="ml-1 text-xs opacity-60">{tempCounts[tab.value]}</span>}
            </button>
          ))}
        </div>
        <Link
          to="/dashboard/military"
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-lato text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap"
        >
          <Shield size={14} /> Military
        </Link>
      </div>

      {/* Search + Filter Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dashboard-secondary" />
          <input
            type="text"
            placeholder={t('leads.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body placeholder:text-dashboard-secondary focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 border rounded-lg transition-colors min-h-[44px] flex items-center gap-1.5 font-lato text-sm ${
            showFilters || statusFilter ? 'border-dashboard-gold text-dashboard-gold bg-dashboard-gold/5' : 'border-dashboard-border text-dashboard-secondary hover:text-dashboard-body'
          }`}
        >
          <Filter size={16} />
          <span className="hidden sm:inline">{t('leads.filter')}</span>
        </button>
        <div className="flex border border-dashboard-border rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('list')} className={`px-3 py-2.5 font-lato text-xs min-h-[44px] ${viewMode === 'list' ? 'bg-dashboard-gold text-white' : 'text-dashboard-secondary hover:bg-dashboard-surface'}`}>{t('leads.listView')}</button>
          <button onClick={() => setViewMode('pipeline')} className={`px-3 py-2.5 font-lato text-xs min-h-[44px] ${viewMode === 'pipeline' ? 'bg-dashboard-gold text-white' : 'text-dashboard-secondary hover:bg-dashboard-surface'}`}>{t('leads.pipelineView')}</button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 bg-dashboard-surface rounded-lg p-3">
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('leads.status')}</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')} className="px-3 py-2 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body bg-white min-h-[36px]">
              <option value="">{t('leads.allStatuses')}</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('leads.sortBy')}</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortField)} className="px-3 py-2 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body bg-white min-h-[36px]">
              <option value="score">{t('leads.score')}</option>
              <option value="last_activity">{t('leads.lastActivity')}</option>
              <option value="created_at">{t('leads.dateAdded')}</option>
              <option value="first_name">{t('leads.name')}</option>
            </select>
          </div>
          {(statusFilter || tempFilter !== 'all') && (
            <button onClick={() => { setStatusFilter(''); setTempFilter('all'); }} className="self-end px-3 py-2 font-lato text-xs text-dashboard-gold hover:underline">{t('leads.clearAll')}</button>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <SkeletonList count={8} />
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-lg p-4 font-lato text-sm">{t('leads.loadError')}</div>
      ) : !leads?.length ? (
        <EmptyState
          icon={Users}
          title={t('leads.noLeadsFound')}
          description={search || statusFilter ? t('leads.adjustFilters') : t('leads.startAdding')}
          actionLabel={search || statusFilter ? t('leads.clearFilters') : undefined}
          onAction={search || statusFilter ? () => { setSearch(''); setStatusFilter(''); setTempFilter('all'); } : undefined}
        />
      ) : viewMode === 'list' ? (
        <>
          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="sticky top-0 z-20 bg-dashboard-gold text-white rounded-xl p-3 flex items-center gap-3 shadow-premium animate-fade-in-up">
              <div className="flex items-center gap-2 flex-1">
                <CheckSquare size={16} />
                <span className="font-lato text-sm font-medium">
                  {selectedIds.size} {t('leads.selected')}
                </span>
              </div>
              <select
                onChange={(e) => { if (e.target.value) bulkChangeStatus(e.target.value as LeadStatus); e.target.value = ''; }}
                className="px-3 py-1.5 rounded-lg bg-white/20 text-white font-lato text-xs border border-white/30 min-h-[36px] cursor-pointer"
                defaultValue=""
                disabled={bulkLoading}
              >
                <option value="" disabled>{t('leads.changeStatus')}</option>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button
                onClick={bulkDelete}
                disabled={bulkLoading}
                className="px-3 py-1.5 rounded-lg bg-white/20 text-white font-lato text-xs font-medium border border-white/30 hover:bg-white/30 transition-colors min-h-[36px] flex items-center gap-1.5"
              >
                <Trash2 size={13} /> {t('leads.delete')}
              </button>
              <button
                onClick={clearSelection}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label={t('leads.clearSelection')}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-dashboard-border divide-y divide-dashboard-border">
            {/* Select all header */}
            <div className="flex items-center gap-3 px-4 py-2 bg-dashboard-surface/50">
              <input
                type="checkbox"
                checked={leads.length > 0 && selectedIds.size === leads.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-dashboard-border text-dashboard-gold focus:ring-dashboard-gold/20 cursor-pointer"
                aria-label={t('leads.selectAll')}
              />
              <span className="font-lato text-xs text-dashboard-secondary">{t('leads.selectAll')}</span>
            </div>
            {leads.map((lead) => (
              <div key={lead.id} className={`flex items-center gap-3 p-4 hover:bg-dashboard-surface/50 transition-colors ${selectedIds.has(lead.id) ? 'bg-dashboard-gold/5' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={() => toggleSelect(lead.id)}
                  className="w-4 h-4 rounded border-dashboard-border text-dashboard-gold focus:ring-dashboard-gold/20 cursor-pointer shrink-0"
                  aria-label={`Select ${lead.first_name} ${lead.last_name}`}
                />
                <Link to={`/dashboard/leads/${lead.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-dashboard-gold/10 flex items-center justify-center shrink-0">
                    <span className="font-lato text-sm font-bold text-dashboard-gold">{lead.first_name[0]}{lead.last_name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-lato text-sm font-medium text-dashboard-black truncate">{lead.first_name} {lead.last_name}</p>
                      {lead.preferred_language === 'es' && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-lato font-medium">ES</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-lato text-xs text-dashboard-secondary capitalize">{lead.status.replace(/_/g, ' ')}</span>
                      {lead.deal_type && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-lato font-medium ${
                          lead.deal_type === 'buyer' ? 'bg-blue-50 text-blue-600'
                          : lead.deal_type === 'seller' ? 'bg-teal-50 text-teal-600'
                          : 'bg-purple-50 text-purple-600'
                        }`}>{lead.deal_type === 'dual' ? 'Both' : lead.deal_type === 'buyer' ? 'Buyer' : 'Seller'}</span>
                      )}
                      {lead.tags?.length > 0 && <span className="font-lato text-xs text-dashboard-secondary">&middot; {lead.tags.slice(0, 2).join(', ')}</span>}
                      {lead.source && <span className="font-lato text-xs text-dashboard-secondary hidden sm:inline">&middot; {lead.source}</span>}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  {lead.phone && (
                    <button onClick={() => window.open(`tel:${lead.phone}`)} aria-label={`${t('leads.call')} ${lead.first_name} ${lead.last_name}`} className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full border border-dashboard-border flex items-center justify-center text-dashboard-secondary hover:text-dashboard-gold hover:border-dashboard-gold transition-colors">
                      <Phone size={14} />
                    </button>
                  )}
                  <LeadScoreBadge score={lead.score} size="sm" showLabel />
                  {lead.last_activity && (() => {
                    const days = differenceInDays(new Date(), new Date(lead.last_activity));
                    const urgencyColor = days <= 1 ? 'text-status-success' : days <= 3 ? 'text-score-warm' : 'text-score-hot';
                    const urgencyLabel = days === 0 ? t('leads.today') : days === 1 ? t('leads.yesterday') : days < 30 ? `${days}d ago` : `${Math.floor(days/30)}mo ago`;
                    return (
                      <span className={`font-lato text-xs font-medium hidden md:block w-16 text-right ${urgencyColor}`} title={format(new Date(lead.last_activity), 'MMM d, yyyy')}>
                        {urgencyLabel}
                      </span>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineGroups.map((group) => (
            <div key={group.value} className="min-w-[280px] flex-shrink-0">
              <div className="bg-dashboard-surface rounded-t-lg px-3 py-2 flex items-center justify-between">
                <h3 className="font-lato text-sm font-medium text-dashboard-black capitalize">{group.label}</h3>
                <span className="font-lato text-xs text-dashboard-secondary">{group.leads.length}</span>
              </div>
              <div className="space-y-2 mt-2">
                {group.leads.map((lead) => (
                  <div key={lead.id} className="bg-white rounded-lg border border-dashboard-border p-3 hover:border-dashboard-gold/40 transition-colors">
                    <Link to={`/dashboard/leads/${lead.id}`} className="block">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-lato text-sm font-medium text-dashboard-black truncate">{lead.first_name} {lead.last_name}</p>
                        <LeadScoreBadge score={lead.score} size="sm" />
                      </div>
                      {lead.phone && <p className="font-lato text-xs text-dashboard-secondary truncate">{lead.phone}</p>}
                      {lead.deal_type && (
                        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-lato font-medium ${
                          lead.deal_type === 'buyer' ? 'bg-blue-50 text-blue-600'
                          : lead.deal_type === 'seller' ? 'bg-teal-50 text-teal-600'
                          : 'bg-purple-50 text-purple-600'
                        }`}>{lead.deal_type === 'dual' ? 'Both' : lead.deal_type === 'buyer' ? 'Buyer' : 'Seller'}</span>
                      )}
                      {lead.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {lead.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-dashboard-surface rounded text-[10px] font-lato text-dashboard-secondary">{tag}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                    <select
                      value={lead.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value as LeadStatus;
                        const label = e.target.options[e.target.selectedIndex].text;
                        if (CLOSING_STATUSES.includes(newStatus)) {
                          await supabase.from('drip_enrollments').update({ status: 'paused' }).eq('lead_id', lead.id).eq('status', 'active');
                        }
                        updateLead.mutate({ id: lead.id, updates: { status: newStatus } }, { onSuccess: () => showToast(`${t('leads.movedTo')} ${label}`), onError: () => showToast(t('leads.updateFailed'), 'error') });
                      }}
                      className="mt-2 w-full px-2 py-1.5 border border-dashboard-border rounded-md font-lato text-xs text-dashboard-secondary bg-dashboard-surface focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <AddLeadModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
