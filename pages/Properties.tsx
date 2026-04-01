import { PHONE_NUMBER } from '../constants';
import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { useTranslation } from '../lib/i18n';

const PropertyMap = lazy(() => import('../components/mls/PropertyMap'));
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropertyCard from '../components/mls/PropertyCard';
import IDXCompliance from '../components/mls/IDXCompliance';
import ListingAttribution from '../components/mls/ListingAttribution';
import { SkeletonPropertyGrid } from '../components/shared/Skeleton';
import { EmptyState } from '../components/shared/EmptyState';
import { useListings, useNeighborhoods, useMLSSyncStatus } from '../hooks/useListings';
import { useRealtimeListings } from '../hooks/useRealtime';
import { logSearch } from '../lib/mls/auditTrail';
import type { PropertyDisplayData } from '../lib/mls/types';
import { MapPin, Search, SlidersHorizontal, GitCompare, X, Grid3x3, Map as MapIcon, AlertTriangle, ChevronLeft, ChevronRight, Phone, MessageSquare, Calendar } from 'lucide-react';
import { showToast } from '../components/shared/Toast';

const Properties = () => {
  const { t } = useTranslation();
  usePageMeta({
    title: 'El Paso Homes & Properties for Sale',
    description: 'Browse homes for sale in El Paso, TX. Filter by neighborhood, price, bedrooms & more. Updated daily with MLS listings from GEPAR.',
    canonicalUrl: 'https://casasenelpasotx.com/properties',
    jsonLd: {
      '@type': 'SearchResultsPage',
      name: 'El Paso Property Search',
      url: 'https://casasenelpasotx.com/properties',
    },
  });

  // Realtime updates
  useRealtimeListings();

  // URL state for filters
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(searchParams.get('neighborhood') || 'all');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 2000000,
  ]);
  const [bedrooms, setBedrooms] = useState(searchParams.get('beds') || 'any');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'all');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'newest');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [compareList, setCompareList] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Build hook filters
  const hookFilters = useMemo(() => ({
    keyword: searchTerm || undefined,
    subdivision: selectedNeighborhood !== 'all' ? selectedNeighborhood : undefined,
    minPrice: priceRange[0] || undefined,
    maxPrice: priceRange[1] < 2000000 ? priceRange[1] : undefined,
    beds: bedrooms !== 'any' ? parseInt(bedrooms) : undefined,
    propertyType: propertyType !== 'all' ? propertyType : undefined,
    sort: sortBy as 'newest' | 'price_asc' | 'price_desc' | 'sqft_desc' | 'dom_asc',
  }), [searchTerm, selectedNeighborhood, priceRange, bedrooms, propertyType, sortBy]);

  const { data: listingsResult, isLoading } = useListings(hookFilters, page, 24);
  const { data: neighborhoods = [] } = useNeighborhoods();
  const { data: syncStatus } = useMLSSyncStatus();

  const filteredProperties = listingsResult?.data || [];
  const totalCount = listingsResult?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / 24);

  // Sync URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchTerm) params.q = searchTerm;
    if (selectedNeighborhood !== 'all') params.neighborhood = selectedNeighborhood;
    if (priceRange[0] > 0) params.minPrice = priceRange[0].toString();
    if (priceRange[1] < 2000000) params.maxPrice = priceRange[1].toString();
    if (bedrooms !== 'any') params.beds = bedrooms;
    if (propertyType !== 'all') params.type = propertyType;
    if (sortBy !== 'newest') params.sort = sortBy;
    if (page > 1) params.page = page.toString();
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedNeighborhood, priceRange, bedrooms, propertyType, sortBy, page, setSearchParams]);

  // Log searches for GEPAR audit trail
  useEffect(() => {
    logSearch({
      searchTerm: searchTerm || undefined,
      neighborhoods: selectedNeighborhood !== 'all' ? [selectedNeighborhood] : undefined,
      minPrice: priceRange[0] || undefined,
      maxPrice: priceRange[1] < 2000000 ? priceRange[1] : undefined,
      minBeds: bedrooms !== 'any' ? parseInt(bedrooms) : undefined,
    });
  }, [searchTerm, selectedNeighborhood, priceRange, bedrooms, propertyType]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCompare = (id: string) => {
    setCompareList((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 3) {
          showToast('You can compare up to 3 properties at a time', 'error');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const comparedProperties = useMemo(
    () => filteredProperties.filter((p) => compareList.has(p.id)),
    [filteredProperties, compareList]
  );

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-b from-dark-100 to-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4">
              Find Your <span className="text-gold italic">Dream Home</span>
            </h1>
            <p className="text-white/60 text-xl max-w-2xl mx-auto">
              {totalCount > 0 ? `${totalCount} homes for sale in El Paso` : 'Explore homes in El Paso\'s finest neighborhoods'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-8 animate-fade-in-up delay-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={20} />
              <input
                type="text"
                placeholder={t('properties.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 text-black pl-12 pr-4 py-4 focus:outline-none focus:border-gold transition-all rounded-lg"
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <div className="flex justify-center animate-fade-in-up delay-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-black hover:border-gold transition-all rounded-lg"
            >
              <SlidersHorizontal size={18} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="max-w-6xl mx-auto mt-8 bg-white border border-gray-200 rounded-lg p-6 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">
                    Neighborhood
                  </label>
                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-black px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
                  >
                    <option value="all">All Neighborhoods</option>
                    {neighborhoods.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-black px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
                  >
                    <option value="all">All Types</option>
                    <option value="single_family">Single Family</option>
                    <option value="condo">Condo / Townhouse</option>
                    <option value="multi_family">Multi-Family</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">
                    Bedrooms
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-black px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
                  >
                    <option value="any">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="price-range" className="block text-xs uppercase tracking-widest text-black/60 mb-2">
                    Max Price: ${(priceRange[1] / 1000).toFixed(0)}K
                  </label>
                  <input
                    id="price-range"
                    type="range"
                    min="0"
                    max="2000000"
                    step="50000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full accent-gold"
                    aria-valuemin={0}
                    aria-valuemax={2000000}
                    aria-valuenow={priceRange[1]}
                    aria-valuetext={`$${(priceRange[1] / 1000).toFixed(0)}K`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stale Data Warning */}
      {syncStatus?.isStale && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-800 text-sm">
            <AlertTriangle size={16} />
            <span>MLS data may be outdated. Last updated {syncStatus.hoursOld > 24 ? `${Math.floor(syncStatus.hoursOld / 24)} days` : `${Math.floor(syncStatus.hoursOld)} hours`} ago.</span>
          </div>
        </div>
      )}

      {/* Property Grid/Map */}
      <section className={`py-20 px-4 bg-warm-white ${compareList.size > 0 ? 'pb-32' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <p className="text-black/60">
              Showing <span className="text-gold font-bold">{totalCount}</span>{' '}
              {totalCount === 1 ? 'property' : 'properties'}
              {totalPages > 1 && <span className="ml-1">(page {page} of {totalPages})</span>}
            </p>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="bg-white border border-gray-200 text-black text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-gold"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="sqft_desc">Largest</option>
                <option value="dom_asc">Days on Market</option>
              </select>

              {/* Grid/Map Toggle */}
              <div className="flex gap-2 bg-white border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gold text-dark font-semibold'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  <Grid3x3 size={18} />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
                    viewMode === 'map'
                      ? 'bg-gold text-dark font-semibold'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  <MapIcon size={18} />
                  <span className="hidden sm:inline">Map</span>
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <SkeletonPropertyGrid count={12} />
          ) : filteredProperties.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No Properties Found"
              description="Try adjusting your filters or search criteria"
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchTerm('');
                setSelectedNeighborhood('all');
                setPriceRange([0, 2000000]);
                setBedrooms('any');
                setPropertyType('all');
              }}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredProperties.map((property, index) => (
                <div key={property.id} className="relative">
                  <PropertyCard
                    property={property}
                    isFavorite={favorites.has(property.id)}
                    onFavorite={toggleFavorite}
                    delay={index * 100}
                  />
                  {/* Compare Button */}
                  <button
                    onClick={() => toggleCompare(property.id)}
                    className={`absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border transition-all text-xs sm:text-sm font-medium rounded z-10 ${
                      compareList.has(property.id)
                        ? 'bg-gold text-dark border-gold'
                        : 'bg-white/90 text-gold border-gold hover:bg-gold hover:text-dark'
                    }`}
                  >
                    <GitCompare size={16} />
                    {compareList.has(property.id) ? 'Added to Compare' : 'Add to Compare'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 h-[600px]">
              <div className="flex-1 rounded-lg overflow-hidden border border-gray-200">
                <Suspense fallback={
                  <div className="h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center"><MapPin className="w-12 h-12 mx-auto mb-2 text-gold animate-pulse" /><p className="font-lato text-sm text-gray-500">Loading map...</p></div>
                  </div>
                }>
                  <PropertyMap properties={filteredProperties} />
                </Suspense>
              </div>
              <div className="w-80 overflow-y-auto space-y-3 hidden lg:block">
                {filteredProperties.map((p) => (
                  <CompactPropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 border border-gray-200 rounded hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-gold text-dark font-bold'
                        : 'border border-gray-200 hover:border-gold text-black/60'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-gray-200 rounded hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Compare Bar */}
      {compareList.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gold shadow-2xl z-40 animate-slide-in-up">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <GitCompare className="text-gold" size={24} />
              <div>
                <p className="text-black font-bold">Compare Properties</p>
                <p className="text-black/60 text-sm">{compareList.size} selected (max 3)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowComparison(true)}
                disabled={compareList.size < 2}
                className="px-6 py-3 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target text-sm sm:text-base"
              >
                Compare Now
              </button>
              <button
                onClick={() => setCompareList(new Set())}
                className="px-4 py-3 border border-gold text-gold hover:bg-gold hover:text-dark transition-colors touch-target"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && comparedProperties.length >= 2 && (
        <ComparisonModal properties={comparedProperties} onClose={() => setShowComparison(false)} />
      )}

      {/* Sticky Mobile Bottom Bar — CINC killer: instant contact */}
      {compareList.size === 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t-2 border-gold shadow-2xl">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="flex flex-col items-center justify-center py-3 text-gold hover:bg-gold/5 transition-colors touch-target"
            >
              <Phone size={20} />
              <span className="text-[11px] font-lato font-medium mt-1">Call</span>
            </a>
            <a
              href={`sms:${PHONE_NUMBER}`}
              className="flex flex-col items-center justify-center py-3 text-gold hover:bg-gold/5 transition-colors touch-target"
            >
              <MessageSquare size={20} />
              <span className="text-[11px] font-lato font-medium mt-1">Text</span>
            </a>
            <a
              href="/contact"
              className="flex flex-col items-center justify-center py-3 text-gold hover:bg-gold/5 transition-colors touch-target"
            >
              <Calendar size={20} />
              <span className="text-[11px] font-lato font-medium mt-1">Consult</span>
            </a>
          </div>
        </div>
      )}

      {/* MLS Disclaimer - REQUIRED by GEPAR */}
      <IDXCompliance variant="full" showLogo />

      <Footer />
      {/* Spacer for mobile bottom bar */}
      <div className="h-16 lg:hidden" />
    </div>
  );
};

// Comparison Modal Component
function ComparisonModal({
  properties,
  onClose,
}: {
  properties: PropertyDisplayData[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto animate-fade-in">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-black/90 py-4 z-10">
            <div>
              <h2 className="text-3xl font-playfair text-white mb-2">Property Comparison</h2>
              <p className="text-white/60">Compare up to 3 properties side-by-side</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white border border-gray-200 hover:bg-gold hover:border-gold rounded-full transition-all group touch-target"
            >
              <X className="text-gold group-hover:text-dark transition-colors" size={24} />
            </button>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 sm:p-6 text-gold text-xs uppercase tracking-wider sticky left-0 bg-white">
                    Feature
                  </th>
                  {properties.map((property) => (
                    <th key={property.id} className="p-4 sm:p-6 min-w-[250px]">
                      <Link
                        to={`/property/${property.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={property.images[0]}
                          alt={`${property.address}, ${property.city}`}
                          className="w-full h-32 object-cover rounded mb-3"
                          width={800}
                          height={600}
                          loading="lazy"
                        />
                        <h3 className="text-black font-semibold text-sm mb-1 line-clamp-2">
                          {property.address}
                        </h3>
                        <p className="text-black/60 text-xs line-clamp-1">
                          {property.city}, {property.state} {property.zip}
                        </p>
                        <p className="text-black/40 text-[10px] font-mono mt-1">
                          MLS# {property.mlsNumber}
                        </p>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">
                    Price
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-gold font-playfair text-xl">
                      ${p.price.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">
                    Bedrooms
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">
                      {p.beds}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">
                    Bathrooms
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">
                      {p.baths}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">
                    Square Feet
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">
                      {p.sqft.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">
                    Year Built
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">
                      {p.yearBuilt}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">
                    Property Type
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">
                      {p.propertyType}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">
                    Neighborhood
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">
                      {p.neighborhood}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">
                    Days on Market
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">
                      {p.daysOnMarket}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">
                    Status
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded ${
                          p.status === 'For Sale'
                            ? 'bg-gold text-dark'
                            : p.status === 'Pending'
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-500 text-white'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  ))}
                </tr>
                {/* Listing Attribution Row */}
                <tr>
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">
                    Listed By
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6">
                      <ListingAttribution
                        officeName={p.listOfficeName}
                        agentName={p.listAgentName}
                        mlsNumber={p.mlsNumber}
                        variant="card"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {properties.map((property) => (
              <Link
                key={property.id}
                to={`/property/${property.id}`}
                className="px-6 py-3 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white transition-colors text-sm"
              >
                View {property.neighborhood} Property
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Property Card for Map View Sidebar
function CompactPropertyCard({ property }: { property: PropertyDisplayData }) {
  return (
    <Link
      to={`/property/${property.id}`}
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all group"
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.address}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          width={800}
          height={600}
          loading="lazy"
        />
        {property.status === 'Pending' && (
          <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Pending
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xl font-bold text-black font-playfair">${property.price.toLocaleString()}</p>
        <div className="flex items-center gap-2 text-xs text-black/60 mt-1 font-lato">
          <span>{property.beds} bd</span>
          <span>&bull;</span>
          <span>{property.baths} ba</span>
          <span>&bull;</span>
          <span>{property.sqft.toLocaleString()} sf</span>
        </div>
        <p className="text-xs text-black/70 mt-2 font-lato">{property.address}</p>
        <p className="text-xs text-black/50 font-lato">
          {property.city}, {property.state}
        </p>
        {/* GEPAR Rule 18.3.4 + 18.2.12: Listing agent + office required */}
        <p className="text-xs text-black/50 mt-2 font-lato">
          Courtesy of {property.listOfficeName}
        </p>
        <p className="text-xs text-black/50 font-lato">{property.listAgentName}</p>
        <p className="text-[10px] text-black/40 font-mono mt-0.5">
          MLS# {property.mlsNumber}
        </p>
      </div>
    </Link>
  );
}

export default Properties;
