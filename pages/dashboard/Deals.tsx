import { useState, useDeferredValue } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, Plus, Search, LayoutGrid, List,
  User, MapPin,
} from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import { useDealsByStage, useDeals } from '../../hooks/useDeals';
import { useRealtimeDeals } from '../../hooks/useRealtime';
import { SkeletonCard } from '../../components/shared/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { CreateDealModal } from '../../components/dashboard/modals/CreateDealModal';
import type { Deal, DealStage } from '../../lib/supabase/database.types';
import { format, parseISO } from 'date-fns';

interface DealWithLead extends Deal {
  leads: { first_name: string; last_name: string; phone: string | null; email: string | null } | null;
}

const stageConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pre_listing: { label: 'Pre-Listing', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  active_listing: { label: 'Active Listing', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  under_contract: { label: 'Under Contract', color: 'text-dashboard-accent', bgColor: 'bg-amber-50 border-amber-200' },
  pending: { label: 'Pending', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  closed: { label: 'Closed', color: 'text-status-success', bgColor: 'bg-green-50 border-green-200' },
  fallen_through: { label: 'Fallen Through', color: 'text-dashboard-secondary', bgColor: 'bg-gray-50 border-gray-200' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function DealCard({ deal }: { deal: DealWithLead }) {
  const { t } = useTranslation();
  const price = deal.sale_price ?? deal.list_price ?? 0;
  const commission = price * (deal.commission_rate ?? 3) / 100;

  return (
    <Link
      to={`/dashboard/leads/${deal.lead_id}`}
      className="block bg-white rounded-lg border border-dashboard-border p-3 hover:border-dashboard-gold/40 hover:shadow-premium transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-lato font-bold uppercase tracking-wide ${
          deal.deal_type === 'buyer' ? 'bg-blue-50 text-blue-700' :
          deal.deal_type === 'seller' ? 'bg-emerald-50 text-emerald-700' :
          'bg-purple-50 text-purple-700'
        }`}>
          {deal.deal_type}
        </span>
        <span className="font-lato text-sm font-bold text-dashboard-black">{formatCurrency(price)}</span>
      </div>

      {deal.property_address && (
        <div className="flex items-start gap-1.5 mb-2">
          <MapPin size={12} className="text-dashboard-secondary mt-0.5 shrink-0" />
          <p className="font-lato text-xs text-dashboard-body line-clamp-2">{deal.property_address}</p>
        </div>
      )}

      {deal.leads && (
        <div className="flex items-center gap-1.5 mb-2">
          <User size={12} className="text-dashboard-secondary shrink-0" />
          <p className="font-lato text-xs text-dashboard-body truncate">
            {deal.leads.first_name} {deal.leads.last_name}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-dashboard-border">
        <span className="font-lato text-[10px] text-dashboard-secondary">
          {deal.estimated_close_date
            ? `${t('deals.close')}: ${format(parseISO(deal.estimated_close_date), 'MMM d')}`
            : t('deals.noCloseDate')}
        </span>
        <span className="font-lato text-xs font-medium text-dashboard-accent">
          {formatCurrency(commission)} ({deal.commission_rate ?? 3}%)
        </span>
      </div>
    </Link>
  );
}

function KanbanView({ dealsByStage }: { dealsByStage: Record<string, DealWithLead[]> }) {
  const { t } = useTranslation();
  const activeStages: DealStage[] = ['pre_listing', 'active_listing', 'under_contract', 'pending', 'closed'];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
      {activeStages.map((stage) => {
        const config = stageConfig[stage];
        const deals = dealsByStage[stage] ?? [];
        const stageVolume = deals.reduce((sum, d) => sum + (d.sale_price ?? d.list_price ?? 0), 0);

        return (
          <div key={stage} className="min-w-[280px] md:min-w-0 md:flex-1">
            {/* Column header */}
            <div className={`rounded-lg border px-3 py-2 mb-3 ${config.bgColor}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-lato text-xs font-bold uppercase tracking-wide ${config.color}`}>
                  {config.label}
                </h3>
                <span className={`font-lato text-xs font-bold ${config.color}`}>{deals.length}</span>
              </div>
              {stageVolume > 0 && (
                <p className="font-lato text-[10px] text-dashboard-secondary mt-0.5">
                  {formatCurrency(stageVolume)}
                </p>
              )}
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {deals.length === 0 ? (
                <div className="border-2 border-dashed border-dashboard-border rounded-lg p-4 text-center">
                  <p className="font-lato text-xs text-dashboard-secondary">{t('deals.noDeals')}</p>
                </div>
              ) : (
                deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ deals }: { deals: DealWithLead[] }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl border border-dashboard-border overflow-hidden">
      {/* Table header */}
      <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_120px_100px_80px] gap-4 px-4 py-3 bg-dashboard-surface border-b border-dashboard-border">
        <span className="font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide">{t('deals.property')}</span>
        <span className="font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide">{t('deals.client')}</span>
        <span className="font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide">{t('deals.type')}</span>
        <span className="font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide text-right">{t('deals.price')}</span>
        <span className="font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide">{t('deals.stage')}</span>
        <span className="font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide">{t('deals.close')}</span>
      </div>

      {deals.length === 0 ? (
        <div className="p-8">
          <EmptyState icon={DollarSign} title={t('deals.noDealsTable')} description={t('deals.noDealsTableDesc')} />
        </div>
      ) : (
        <div className="divide-y divide-dashboard-border">
          {deals.map((deal) => {
            const config = stageConfig[deal.stage];
            return (
              <Link
                key={deal.id}
                to={`/dashboard/leads/${deal.lead_id}`}
                className="block px-4 py-3 hover:bg-dashboard-surface/50 transition-colors"
              >
                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-lato text-sm font-medium text-dashboard-black truncate flex-1">
                      {deal.property_address ?? t('deals.tbdAddress')}
                    </p>
                    <span className="font-lato text-sm font-bold text-dashboard-black ml-2">
                      {formatCurrency(deal.sale_price ?? deal.list_price ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {deal.leads && (
                      <span className="font-lato text-xs text-dashboard-secondary">
                        {deal.leads.first_name} {deal.leads.last_name}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-lato font-medium ${config.color} ${config.bgColor.split(' ')[0]}`}>
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_120px_100px_80px] gap-4 items-center">
                  <p className="font-lato text-sm font-medium text-dashboard-black truncate">
                    {deal.property_address ?? t('deals.tbdAddress')}
                  </p>
                  <p className="font-lato text-xs text-dashboard-body truncate">
                    {deal.leads ? `${deal.leads.first_name} ${deal.leads.last_name}` : '—'}
                  </p>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-lato font-bold uppercase w-fit ${
                    deal.deal_type === 'buyer' ? 'bg-blue-50 text-blue-700' :
                    deal.deal_type === 'seller' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    {deal.deal_type}
                  </span>
                  <p className="font-lato text-sm font-bold text-dashboard-black text-right">
                    {formatCurrency(deal.sale_price ?? deal.list_price ?? 0)}
                  </p>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-lato font-medium w-fit ${config.color} ${config.bgColor.split(' ')[0]}`}>
                    {config.label}
                  </span>
                  <p className="font-lato text-xs text-dashboard-secondary">
                    {deal.estimated_close_date ? format(parseISO(deal.estimated_close_date), 'MMM d') : '—'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Deals() {
  usePageTitle('Deals Pipeline');
  const { t } = useTranslation();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [showAddDeal, setShowAddDeal] = useState(false);
  const deferredSearch = useDeferredValue(search);

  useRealtimeDeals();

  const { data: dealsByStage, isLoading: kanbanLoading } = useDealsByStage();
  const { data: allDeals, isLoading: listLoading } = useDeals(deferredSearch ? { search: deferredSearch } : undefined);

  const isLoading = view === 'kanban' ? kanbanLoading : listLoading;

  // Summary stats
  const allDealsList = allDeals ?? Object.values(dealsByStage ?? {}).flat();
  const activeDeals = allDealsList.filter(d => !['closed', 'fallen_through'].includes(d.stage));
  const totalVolume = activeDeals.reduce((sum, d) => sum + (d.sale_price ?? d.list_price ?? 0), 0);
  const totalCommission = activeDeals.reduce((sum, d) => {
    const price = d.sale_price ?? d.list_price ?? 0;
    return sum + (price * (d.commission_rate ?? 3) / 100);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">
            {t('deals.title')}
          </h1>
          <p className="font-lato text-sm text-dashboard-secondary mt-1">
            {activeDeals.length} {activeDeals.length !== 1 ? t('deals.activeDeals') : t('deals.activeDeal')} &middot; {formatCurrency(totalVolume)} {t('deals.volume')} &middot; {formatCurrency(totalCommission)} {t('deals.commission')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddDeal(true)}
            className="px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px] flex items-center gap-1.5"
          >
            <Plus size={16} /> {t('deals.addDeal')}
          </button>
          {/* View toggle */}
          <div className="flex items-center bg-dashboard-surface rounded-lg border border-dashboard-border p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-lato font-medium transition-colors min-h-[36px] ${
                view === 'kanban' ? 'bg-white text-dashboard-black shadow-sm' : 'text-dashboard-secondary hover:text-dashboard-body'
              }`}
            >
              <LayoutGrid size={14} /> {t('deals.board')}
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-lato font-medium transition-colors min-h-[36px] ${
                view === 'list' ? 'bg-white text-dashboard-black shadow-sm' : 'text-dashboard-secondary hover:text-dashboard-body'
              }`}
            >
              <List size={14} /> {t('deals.listView')}
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dashboard-secondary" />
          <input
            type="text"
            placeholder={t('deals.searchDeals')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body placeholder:text-dashboard-secondary focus:outline-none focus:border-dashboard-gold/60 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : view === 'kanban' ? (
        <KanbanView dealsByStage={(dealsByStage ?? {}) as Record<string, DealWithLead[]>} />
      ) : (
        <ListView deals={(allDeals ?? []) as DealWithLead[]} />
      )}

      <CreateDealModal isOpen={showAddDeal} onClose={() => setShowAddDeal(false)} />
    </div>
  );
}
