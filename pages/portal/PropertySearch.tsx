import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, Bell, BellOff, Trash2, Save, MapPin } from 'lucide-react';
import { useListings } from '../../hooks/useListings';
import { useClientSavedSearches, useSaveSearch, useToggleSearchAlert, useDeleteSavedSearch, useToggleFavorite, useClientFavorites } from '../../hooks/portal/useClientListings';
import { SkeletonPropertyGrid } from '../../components/shared/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { showToast } from '../../components/shared/Toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import type { PropertyFilters } from '../../lib/mls/types';

interface PortalFilters extends PropertyFilters {
  zip?: string;
  beds?: number;
  baths?: number;
  propertyType?: string;
}

const inputClass = 'w-full px-3 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body placeholder:text-dashboard-secondary focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]';

export default function PropertySearch() {
  usePageTitle('Search Homes');
  const { t } = useTranslation();
  const [filters, setFilters] = useState<PortalFilters>({});
  const [page, setPage] = useState(1);
  const [searchName, setSearchName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const hookFilters = {
    ...(filters.zip ? { zip_code: filters.zip } : {}),
    ...(filters.minPrice ? { minPrice: filters.minPrice } : {}),
    ...(filters.maxPrice ? { maxPrice: filters.maxPrice } : {}),
    ...(filters.beds ? { beds: filters.beds } : {}),
    ...(filters.baths ? { baths: filters.baths } : {}),
    ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
  };

  const { data, isLoading } = useListings(hookFilters, page, 12);
  const listings = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  const { data: savedSearches = [] } = useClientSavedSearches();
  const saveSearch = useSaveSearch();
  const toggleAlert = useToggleSearchAlert();
  const deleteSearch = useDeleteSavedSearch();
  const toggleFav = useToggleFavorite();
  const { data: favorites = [] } = useClientFavorites();
  const favIds = new Set(favorites.map(f => f.id));

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    saveSearch.mutate({ name: searchName, criteria: filters }, {
      onSuccess: () => { showToast('Search saved'); setShowSaveForm(false); setSearchName(''); },
      onError: () => showToast('Failed to save search', 'error'),
    });
  };

  const applySearch = (criteria: Record<string, unknown>) => {
    setFilters(criteria as PropertyFilters);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('portal.search.title')}</h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">{t('portal.search.subtitle')}</p>
      </div>

      {/* Saved searches */}
      {savedSearches.length > 0 && (
        <div className="bg-white rounded-xl border border-dashboard-border p-4">
          <h3 className="font-playfair text-sm font-bold text-dashboard-black mb-3">{t('portal.search.mySavedSearches')}</h3>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 bg-dashboard-surface rounded-lg px-3 py-1.5">
                <button
                  onClick={() => applySearch(s.criteria as Record<string, unknown>)}
                  className="font-lato text-xs text-dashboard-body hover:text-dashboard-gold"
                >
                  {s.name}
                </button>
                <button
                  onClick={() => toggleAlert.mutate({ id: s.id, enabled: !s.alert_enabled })}
                  className="text-dashboard-secondary hover:text-dashboard-gold"
                  title={s.alert_enabled ? 'Disable alerts' : 'Enable alerts'}
                >
                  {s.alert_enabled ? <Bell size={12} /> : <BellOff size={12} />}
                </button>
                <button
                  onClick={() => deleteSearch.mutate(s.id, { onSuccess: () => showToast('Search deleted') })}
                  className="text-dashboard-secondary hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-dashboard-border p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('portal.search.zipCode')}</label>
            <input type="text" placeholder={t('portal.zipPlaceholder')} value={filters.zip || ''} onChange={e => { setFilters(f => ({ ...f, zip: e.target.value || undefined })); setPage(1); }} className={inputClass} />
          </div>
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('portal.search.minPrice')}</label>
            <input type="number" placeholder={t('portal.minPricePlaceholder')} value={filters.minPrice || ''} onChange={e => { setFilters(f => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined })); setPage(1); }} className={inputClass} />
          </div>
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('portal.search.maxPrice')}</label>
            <input type="number" placeholder={t('portal.maxPricePlaceholder')} value={filters.maxPrice || ''} onChange={e => { setFilters(f => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined })); setPage(1); }} className={inputClass} />
          </div>
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('portal.search.beds')}</label>
            <select value={filters.beds || ''} onChange={e => { setFilters(f => ({ ...f, beds: e.target.value ? Number(e.target.value) : undefined })); setPage(1); }} className={inputClass}>
              <option value="">{t('portal.search.any')}</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('portal.search.baths')}</label>
            <select value={filters.baths || ''} onChange={e => { setFilters(f => ({ ...f, baths: e.target.value ? Number(e.target.value) : undefined })); setPage(1); }} className={inputClass}>
              <option value="">{t('portal.search.any')}</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
            </select>
          </div>
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('portal.search.type')}</label>
            <select value={filters.propertyType || ''} onChange={e => { setFilters(f => ({ ...f, propertyType: e.target.value || undefined })); setPage(1); }} className={inputClass}>
              <option value="">{t('portal.search.any')}</option>
              <option value="Single Family">{t('portal.search.singleFamily')}</option>
              <option value="Condo">{t('portal.search.condo')}</option>
              <option value="Townhouse">{t('portal.search.townhouse')}</option>
              <option value="Multi-Family">{t('portal.search.multiFamily')}</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="flex items-center gap-1.5 font-lato text-xs text-dashboard-gold hover:underline min-h-[44px]"
          >
            <Save size={14} />
            {t('portal.search.saveThisSearch')}
          </button>
          {Object.keys(filters).length > 0 && (
            <button
              onClick={() => { setFilters({}); setPage(1); }}
              className="font-lato text-xs text-dashboard-secondary hover:text-dashboard-body min-h-[44px]"
            >
              {t('portal.search.clearFilters')}
            </button>
          )}
        </div>
        {showSaveForm && (
          <div className="flex items-center gap-2 mt-2">
            <input type="text" placeholder={t('portal.search.searchNamePlaceholder')} value={searchName} onChange={e => setSearchName(e.target.value)} className={`${inputClass} max-w-[200px]`} />
            <button onClick={handleSaveSearch} disabled={saveSearch.isPending} className="px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato text-xs rounded-lg min-h-[44px]">
              {saveSearch.isPending ? t('portal.search.saving') : t('portal.search.save')}
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="font-lato text-sm text-dashboard-secondary">
        {totalCount > 0 ? `${totalCount.toLocaleString()} ${t('portal.search.homesForSale')}` : ''}
      </p>

      {/* Results */}
      {isLoading ? (
        <SkeletonPropertyGrid count={6} />
      ) : listings.length === 0 ? (
        <EmptyState icon={Search} title={t('portal.search.noHomesFound')} description={t('portal.search.noHomesDesc')} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-xl border border-dashboard-border overflow-hidden hover:border-dashboard-gold/30 transition-colors">
                <Link to={`/property/${listing.id}`} className="block">
                  <div className="h-44 bg-dashboard-surface relative">
                    {listing.images[0] && (
                      <img src={listing.images[0]} alt={listing.address} className="w-full h-full object-cover" width={800} height={600} loading="lazy" />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 rounded font-lato text-[10px] font-medium text-dashboard-body">
                      {listing.status}
                    </span>
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-playfair text-lg font-bold text-dashboard-gold">${listing.price.toLocaleString()}</p>
                      <p className="font-lato text-sm text-dashboard-body truncate mt-0.5 flex items-center gap-1">
                        <MapPin size={12} className="flex-shrink-0" />
                        {listing.address}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFav.mutate(
                        { listingId: listing.id, isFavorited: favIds.has(listing.id) },
                        { onError: () => showToast('Please contact Lorena to activate your account', 'error') }
                      )}
                      className="p-2 ml-2 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Heart
                        size={18}
                        className={favIds.has(listing.id) ? 'text-red-500 fill-red-500' : 'text-dashboard-secondary'}
                      />
                    </button>
                  </div>
                  <p className="font-lato text-xs text-dashboard-secondary mt-1">
                    {listing.beds} bd · {listing.baths} ba · {listing.sqft?.toLocaleString()} sqft
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalCount > 12 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-dashboard-border rounded-lg font-lato text-sm disabled:opacity-50 min-h-[44px]"
              >
                {t('portal.search.previous')}
              </button>
              <span className="font-lato text-sm text-dashboard-secondary">
                {t('portal.search.page')} {page} {t('portal.search.of')} {Math.ceil(totalCount / 12)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(totalCount / 12)}
                className="px-4 py-2 border border-dashboard-border rounded-lg font-lato text-sm disabled:opacity-50 min-h-[44px]"
              >
                {t('portal.search.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
