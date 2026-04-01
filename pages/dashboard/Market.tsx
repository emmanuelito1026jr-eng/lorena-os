import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, MapPin, DollarSign, BarChart3,
  FileText, Building, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Area, Line,
} from 'recharts';
import { usePageTitle } from '../../hooks/usePageTitle';
import { usePropertyStats } from '../../hooks/useMarketData';
import { useCMAReports } from '../../hooks/useCMAReports';
import { useMarketSnapshot, useMarketTrend, useZipBreakdown } from '../../hooks/useMarketSnapshots';
import { useFeaturedListings } from '../../hooks/useListings';
import { SkeletonCard, SkeletonStats } from '../../components/shared/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../../lib/i18n/LanguageContext';

const CHART_COLORS = ['#0D9488', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export default function Market() {
  usePageTitle('HomePulse');
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'neighborhoods' | 'reports'>('overview');
  const { data: propertyStats, isLoading: statsLoading } = usePropertyStats();
  const { data: reports, isLoading: reportsLoading } = useCMAReports();
  const { data: marketData } = useMarketSnapshot('El Paso', 'city');
  const { data: trendData } = useMarketTrend('El Paso', 90);
  const { data: zipData } = useZipBreakdown();
  const { data: newListings } = useFeaturedListings(10);

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-dashboard-border rounded animate-pulse" />
        <SkeletonStats count={4} />
        <SkeletonCard />
      </div>
    );
  }

  const stats = propertyStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">
            {t('homepulse.title')}
          </h1>
          <p className="font-lato text-sm text-dashboard-secondary mt-1">
            {t('homepulse.subtitle')} &middot; {stats?.totalActive ?? 0} {t('homepulse.activeListings').toLowerCase()}
          </p>
        </div>
        <Link
          to="/dashboard/cma"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
        >
          <FileText size={16} /> {t('homepulse.generateCMA')}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dashboard-surface rounded-lg p-1">
        {[
          { key: 'overview' as const, label: t('homepulse.overview') },
          { key: 'neighborhoods' as const, label: t('homepulse.neighborhoods') },
          { key: 'reports' as const, label: t('homepulse.cmaReports') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-md font-lato text-sm font-medium transition-colors min-h-[44px] ${
              activeTab === tab.key ? 'bg-white shadow-sm text-dashboard-black' : 'text-dashboard-secondary hover:text-dashboard-body'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Market Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-dashboard-border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-lato text-[11px] text-dashboard-secondary uppercase tracking-wide">{t('homepulse.activeListings')}</p>
                <Home size={16} className="text-dashboard-teal" />
              </div>
              <p className="font-playfair text-2xl font-bold text-dashboard-black">{stats?.totalActive ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-dashboard-border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-lato text-[11px] text-dashboard-secondary uppercase tracking-wide">{t('homepulse.avgPrice')}</p>
                <DollarSign size={16} className="text-dashboard-accent" />
              </div>
              <p className="font-playfair text-2xl font-bold text-dashboard-black">{formatCurrency(stats?.avgPrice ?? 0)}</p>
            </div>
            <div className="bg-white rounded-xl border border-dashboard-border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-lato text-[11px] text-dashboard-secondary uppercase tracking-wide">{t('homepulse.avgSqft')}</p>
                <Building size={16} className="text-purple-600" />
              </div>
              <p className="font-playfair text-2xl font-bold text-dashboard-black">{stats?.avgSqft?.toLocaleString() ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-dashboard-border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-lato text-[11px] text-dashboard-secondary uppercase tracking-wide">{t('homepulse.propertyTypes')}</p>
                <BarChart3 size={16} className="text-blue-600" />
              </div>
              <p className="font-playfair text-2xl font-bold text-dashboard-black">{stats?.byType?.length ?? 0}</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Distribution */}
            <div className="bg-white rounded-xl border border-dashboard-border p-4">
              <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-4">{t('homepulse.priceDistribution')}</h3>
              {stats?.priceRanges?.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.priceRanges} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 11, fontFamily: 'Lato, sans-serif', fill: '#888888' }}
                        axisLine={{ stroke: '#E5E5E0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fontFamily: 'Lato, sans-serif', fill: '#888888' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: '12px',
                          fontFamily: 'Lato, sans-serif',
                          borderRadius: '8px',
                          border: '1px solid #E5E5E0',
                        }}
                        formatter={(value: number) => [`${value} listings`, 'Count']}
                      />
                      <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="font-lato text-sm text-dashboard-secondary text-center py-8">{t('homepulse.noData')}</p>
              )}
            </div>

            {/* Property Types */}
            <div className="bg-white rounded-xl border border-dashboard-border p-4">
              <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-4">{t('homepulse.propertyTypes')}</h3>
              {stats?.byType?.length ? (
                <div className="flex items-center gap-6">
                  <div className="w-40 h-40 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.byType}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={65}
                          dataKey="count"
                          nameKey="type"
                          strokeWidth={2}
                          stroke="#FAFAF5"
                        >
                          {stats.byType.map((_entry, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            fontSize: '12px',
                            fontFamily: 'Lato, sans-serif',
                            borderRadius: '8px',
                            border: '1px solid #E5E5E0',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {stats.byType.map((item, index) => (
                      <div key={item.type} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="font-lato text-xs text-dashboard-body capitalize flex-1 truncate">
                          {item.type.replace(/_/g, ' ')}
                        </span>
                        <span className="font-lato text-xs font-bold text-dashboard-black">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="font-lato text-sm text-dashboard-secondary text-center py-8">{t('homepulse.noData')}</p>
              )}
            </div>
          </div>

          {/* Real MLS Market Data */}
          {marketData?.current && (
            <div className="bg-white rounded-xl border border-dashboard-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-playfair text-lg font-bold text-dashboard-black">{t('homepulse.marketSnapshot')}</h3>
                {marketData.current.months_of_inventory && (
                  <span className={`px-3 py-1 rounded-full text-xs font-lato font-bold ${
                    Number(marketData.current.months_of_inventory) < 4 ? 'bg-red-50 text-red-700' :
                    Number(marketData.current.months_of_inventory) <= 6 ? 'bg-yellow-50 text-yellow-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {Number(marketData.current.months_of_inventory) < 4 ? t('homepulse.sellersMarket') :
                     Number(marketData.current.months_of_inventory) <= 6 ? t('homepulse.balancedMarket') : t('homepulse.buyersMarket')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: t('homepulse.active'), value: marketData.current.active_count, trend: marketData.previous?.active_count },
                  { label: t('market.medianPrice'), value: marketData.current.median_price ? formatCurrency(Number(marketData.current.median_price)) : 'N/A', trend: marketData.previous?.median_price ? Number(marketData.previous.median_price) : null, currentNum: marketData.current.median_price ? Number(marketData.current.median_price) : null },
                  { label: t('homepulse.avgDOM'), value: `${marketData.current.avg_dom ?? 0}d`, trend: marketData.previous?.avg_dom },
                  { label: t('homepulse.inventory'), value: `${marketData.current.months_of_inventory ?? 0}mo` },
                  { label: t('homepulse.new7d'), value: marketData.current.new_count_7d },
                  { label: t('homepulse.pending'), value: marketData.current.pending_count },
                ].map((stat) => (
                  <div key={stat.label} className="bg-dashboard-surface rounded-lg p-3 text-center">
                    <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">{stat.label}</p>
                    <p className="font-playfair text-lg font-bold text-dashboard-black mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Trend Chart */}
          {trendData && trendData.length > 2 && (
            <div className="bg-white rounded-xl border border-dashboard-border p-4">
              <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-4">{t('homepulse.marketTrend')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData.map(d => ({
                    date: d.snapshot_date,
                    median: d.median_price ? Number(d.median_price) : 0,
                    active: d.active_count,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fontFamily: 'Lato, sans-serif', fill: '#888' }}
                      tickFormatter={(v: string) => v.slice(5)}
                      axisLine={{ stroke: '#E5E5E0' }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10, fontFamily: 'Lato, sans-serif', fill: '#888' }}
                      tickFormatter={(v: number) => formatCurrency(v)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10, fontFamily: 'Lato, sans-serif', fill: '#888' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: '12px', fontFamily: 'Lato, sans-serif', borderRadius: '8px', border: '1px solid #E5E5E0' }}
                      formatter={(value: number, name: string) => [name === 'median' ? formatCurrency(value) : value, name === 'median' ? 'Median Price' : 'Active Listings']}
                    />
                    <Area yAxisId="right" type="monotone" dataKey="active" fill="#E5E5E0" stroke="#888" fillOpacity={0.3} />
                    <Line yAxisId="left" type="monotone" dataKey="median" stroke="#C9A84C" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* New Listings Feed */}
          {newListings && newListings.length > 0 && (
            <div className="bg-white rounded-xl border border-dashboard-border p-4">
              <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-4">{t('homepulse.latestListings')}</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {newListings.slice(0, 10).map((listing) => (
                  <a
                    key={listing.id}
                    href={`/property/${listing.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-48 bg-dashboard-surface rounded-lg overflow-hidden hover:shadow-md transition-all group"
                  >
                    <div className="h-28 overflow-hidden">
                      <img
                        src={listing.images[0] || '/images/properties/home-1.jpg'}
                        alt={listing.address}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        width={800}
                        height={600}
                        loading="lazy"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="font-playfair text-sm font-bold text-dashboard-black">${listing.price.toLocaleString()}</p>
                      <p className="font-lato text-[11px] text-dashboard-secondary mt-0.5 truncate">{listing.beds}bd · {listing.baths}ba · {listing.address}</p>
                      <p className="font-lato text-[10px] text-dashboard-gold mt-1">{listing.daysOnMarket}d {t('homepulse.daysOnMarket')}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Neighborhoods Tab */}
      {activeTab === 'neighborhoods' && (
        <div className="space-y-4">
          {zipData && zipData.length > 0 && (
            <div className="bg-white rounded-xl border border-dashboard-border overflow-hidden mb-4">
              <div className="px-4 py-3 bg-dashboard-surface border-b border-dashboard-border">
                <h3 className="font-playfair text-base font-bold text-dashboard-black">{t('homepulse.mlsAreaBreakdown')}</h3>
              </div>
              <div className="hidden md:grid md:grid-cols-[1fr_80px_100px_80px_80px] gap-3 px-4 py-2 bg-dashboard-surface/50 border-b border-dashboard-border">
                <span className="font-lato text-[10px] font-bold text-dashboard-secondary uppercase">{t('homepulse.zipCode')}</span>
                <span className="font-lato text-[10px] font-bold text-dashboard-secondary uppercase text-right">{t('homepulse.active')}</span>
                <span className="font-lato text-[10px] font-bold text-dashboard-secondary uppercase text-right">{t('homepulse.median')}</span>
                <span className="font-lato text-[10px] font-bold text-dashboard-secondary uppercase text-right">{t('homepulse.priceSqft')}</span>
                <span className="font-lato text-[10px] font-bold text-dashboard-secondary uppercase text-right">{t('homepulse.avgDOM')}</span>
              </div>
              <div className="divide-y divide-dashboard-border max-h-[300px] overflow-y-auto">
                {zipData.map((zip) => (
                  <div key={zip.area} className="px-4 py-2.5 hover:bg-dashboard-surface/30 transition-colors">
                    <div className="hidden md:grid md:grid-cols-[1fr_80px_100px_80px_80px] gap-3 items-center">
                      <span className="font-lato text-sm font-medium text-dashboard-black">{zip.area}</span>
                      <span className="font-lato text-sm text-dashboard-body text-right">{zip.active_count}</span>
                      <span className="font-lato text-sm font-medium text-dashboard-black text-right">{zip.median_price ? formatCurrency(Number(zip.median_price)) : '-'}</span>
                      <span className="font-lato text-sm text-dashboard-body text-right">${zip.avg_price_per_sqft ?? '-'}</span>
                      <span className="font-lato text-sm text-dashboard-body text-right">{zip.avg_dom ?? '-'}</span>
                    </div>
                    <div className="md:hidden flex items-center justify-between">
                      <span className="font-lato text-sm font-medium text-dashboard-black">{zip.area}</span>
                      <span className="font-lato text-sm text-dashboard-body">{zip.active_count} active &middot; {zip.median_price ? formatCurrency(Number(zip.median_price)) : '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!stats?.byNeighborhood?.length ? (
            <EmptyState icon={MapPin} title={t('homepulse.noNeighborhoodData')} description={t('homepulse.noNeighborhoodDesc')} />
          ) : (
            <div className="bg-white rounded-xl border border-dashboard-border overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid md:grid-cols-[1fr_100px_120px_80px] gap-4 px-4 py-3 bg-dashboard-surface border-b border-dashboard-border">
                <span className="font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide">{t('homepulse.neighborhood')}</span>
                <span className="font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide text-right">{t('homepulse.avgPrice')}</span>
                <span className="font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide text-right">{t('homepulse.listings')}</span>
                <span className="font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide text-right">{t('homepulse.share')}</span>
              </div>
              <div className="divide-y divide-dashboard-border">
                {stats.byNeighborhood.map((hood) => {
                  const share = stats.totalActive > 0 ? Math.round((hood.count / stats.totalActive) * 100) : 0;
                  return (
                    <div key={hood.name} className="px-4 py-3">
                      {/* Mobile */}
                      <div className="md:hidden">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-dashboard-teal shrink-0" />
                            <p className="font-lato text-sm font-medium text-dashboard-black">{hood.name}</p>
                          </div>
                          <span className="font-lato text-sm font-bold text-dashboard-black">{formatCurrency(hood.avgPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-lato text-xs text-dashboard-secondary">{hood.count} {t('homepulse.listings').toLowerCase()}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-dashboard-border rounded-full overflow-hidden">
                              <div className="h-full bg-dashboard-teal rounded-full" style={{ width: `${share}%` }} />
                            </div>
                            <span className="font-lato text-xs text-dashboard-secondary">{share}%</span>
                          </div>
                        </div>
                      </div>
                      {/* Desktop */}
                      <div className="hidden md:grid md:grid-cols-[1fr_100px_120px_80px] gap-4 items-center">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-dashboard-teal shrink-0" />
                          <p className="font-lato text-sm font-medium text-dashboard-black">{hood.name}</p>
                        </div>
                        <p className="font-lato text-sm font-bold text-dashboard-black text-right">{formatCurrency(hood.avgPrice)}</p>
                        <p className="font-lato text-sm text-dashboard-body text-right">{hood.count}</p>
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-12 h-1.5 bg-dashboard-border rounded-full overflow-hidden">
                            <div className="h-full bg-dashboard-teal rounded-full" style={{ width: `${share}%` }} />
                          </div>
                          <span className="font-lato text-xs text-dashboard-secondary w-8 text-right">{share}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CMA Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-lato text-sm text-dashboard-secondary">
              {reports?.length ?? 0} {t('homepulse.reportsGenerated')}
            </p>
            <Link
              to="/dashboard/cma"
              className="flex items-center gap-1.5 px-3 py-2 bg-dashboard-teal text-white font-lato font-medium text-xs rounded-lg hover:bg-dashboard-teal/90 transition-colors min-h-[36px]"
            >
              <FileText size={14} /> {t('homepulse.newCMA')}
            </Link>
          </div>

          {reportsLoading ? (
            <SkeletonCard />
          ) : !reports?.length ? (
            <EmptyState
              icon={FileText}
              title={t('homepulse.noCMAReports')}
              description={t('homepulse.noCMADesc')}
              actionLabel={t('homepulse.generateCMA')}
            />
          ) : (
            <div className="bg-white rounded-xl border border-dashboard-border divide-y divide-dashboard-border">
              {reports.map((report) => (
                <div key={report.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dashboard-teal/10 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-dashboard-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-lato text-sm font-medium text-dashboard-black truncate">{report.address}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {report.estimated_value && (
                        <span className="font-lato text-xs text-dashboard-accent font-medium">
                          {formatCurrency(report.estimated_value)}
                        </span>
                      )}
                      <span className="font-lato text-xs text-dashboard-secondary">
                        {format(parseISO(report.created_at), 'MMM d, yyyy')}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-lato font-medium ${
                        report.status === 'complete' ? 'bg-green-50 text-green-700' :
                        report.status === 'generating' ? 'bg-blue-50 text-blue-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                  {report.pdf_url && (
                    <a
                      href={report.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-lato text-xs text-dashboard-gold hover:underline flex items-center gap-0.5"
                    >
                      View <ChevronRight size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
