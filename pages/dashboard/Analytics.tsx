import { useState, useMemo } from 'react';
import { BarChart3, Users, TrendingUp, MessageSquare, Calendar, DollarSign, Filter } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonStats, SkeletonCard } from '../../components/shared/Skeleton';
import { useOverviewStats, useLeadSourceStats, useAutomationStats } from '../../hooks/useAnalytics';
import { useLeads } from '../../hooks/useLeads';
import { useCommissionForecast } from '../../hooks/useCommissionForecast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import { HOT_THRESHOLD, WARM_THRESHOLD, COOL_THRESHOLD } from '../../lib/scoring/constants';

type RangePreset = 'today' | '7d' | '30d' | 'all';

function getDateRange(preset: RangePreset): { start: string; end: string } | null {
  if (preset === 'all') return null;
  const today = format(new Date(), 'yyyy-MM-dd');
  if (preset === 'today') return { start: today, end: today };
  if (preset === '7d') return { start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: today };
  return { start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: today };
}

export default function Analytics() {
  usePageTitle('Analytics');
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('Overview');
  const [rangePreset, setRangePreset] = useState<RangePreset>('all');
  const dateRange = useMemo(() => getDateRange(rangePreset), [rangePreset]);

  const { data: stats, isLoading: statsLoading } = useOverviewStats();
  const { data: sourceStats, isLoading: sourceLoading } = useLeadSourceStats(dateRange);
  const { data: automationStats } = useAutomationStats();
  const { data: allLeads } = useLeads();

  const isLoading = statsLoading;

  const { data: forecast } = useCommissionForecast();

  const TABS: { id: string; label: string }[] = [
    { id: 'Overview', label: t('analytics.overview') },
    { id: 'Funnel', label: t('analytics.funnel') },
    { id: 'Leads', label: t('analytics.leadsTab') },
    { id: 'Automations', label: t('analytics.automations') },
  ];

  // Compute lead temperature distribution
  const tempData = allLeads ? [
    { name: t('analytics.hot'), count: allLeads.filter(l => l.score >= HOT_THRESHOLD).length, color: '#DC2626' },
    { name: t('leads.warm'), count: allLeads.filter(l => l.score >= WARM_THRESHOLD && l.score < HOT_THRESHOLD).length, color: '#EA580C' },
    { name: t('leads.cool'), count: allLeads.filter(l => l.score >= COOL_THRESHOLD && l.score < WARM_THRESHOLD).length, color: '#2563EB' },
    { name: t('leads.cold'), count: allLeads.filter(l => l.score < COOL_THRESHOLD).length, color: '#9CA3AF' },
  ] : [];

  // Compute lead status distribution
  const statusData = allLeads ? (() => {
    const counts = new Map<string, number>();
    for (const l of allLeads) {
      counts.set(l.status, (counts.get(l.status) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  })() : [];

  // Source data for chart
  const sourceChartData = (sourceStats ?? []).map(s => ({
    name: s.source,
    total: s.count,
    hot: s.hotCount,
  })).sort((a, b) => b.total - a.total);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-dashboard-border rounded animate-pulse" />
        <SkeletonStats count={4} />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('analytics.title')}</h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">{t('analytics.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-dashboard-border">
        <div className="flex gap-0 overflow-x-auto" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id.toLowerCase()}`}
              id={`tab-${tab.id.toLowerCase()}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-lato text-sm font-medium border-b-2 transition-colors min-h-[44px] whitespace-nowrap ${
                activeTab === tab.id ? 'border-dashboard-gold text-dashboard-gold' : 'border-transparent text-dashboard-secondary hover:text-dashboard-body'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Presets */}
      <div className="flex gap-2">
        {([['today', t('analytics.today')], ['7d', t('analytics.7days')], ['30d', t('analytics.30days')], ['all', t('analytics.allTime')]] as [RangePreset, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRangePreset(key)}
            className={`px-3 py-1.5 rounded-lg font-lato text-xs font-medium transition-colors min-h-[36px] ${
              rangePreset === key ? 'bg-dashboard-gold text-white' : 'bg-white border border-dashboard-border text-dashboard-secondary hover:text-dashboard-body'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6" role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('analytics.totalLeads'), value: allLeads?.length ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: t('analytics.hotLeads'), value: stats?.hotLeads ?? 0, icon: TrendingUp, color: 'text-red-600 bg-red-50' },
              { label: t('analytics.unreadMessages'), value: stats?.unreadMessages ?? 0, icon: MessageSquare, color: 'text-green-600 bg-green-50' },
              { label: t('analytics.showingsToday'), value: stats?.showingsToday ?? 0, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-dashboard-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-lato text-xs text-dashboard-secondary">{stat.label}</p>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={16} />
                  </div>
                </div>
                <p className="font-playfair text-2xl font-bold text-dashboard-black">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Temperature + Status Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temperature Distribution */}
            <div className="bg-white rounded-xl border border-dashboard-border p-5">
              <h3 className="font-playfair text-base font-bold text-dashboard-black mb-4">{t('analytics.leadTemperature')}</h3>
              {!tempData.length || tempData.every(td => td.count === 0) ? (
                <p className="font-lato text-sm text-dashboard-secondary text-center py-8">{t('analytics.noLeadData')}</p>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={tempData} dataKey="count" cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={2}>
                          {tempData.map((entry, _i) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {tempData.map((td) => (
                      <div key={td.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: td.color }} />
                        <span className="font-lato text-sm text-dashboard-body">{td.name}</span>
                        <span className="font-lato text-sm font-medium text-dashboard-black">{td.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-xl border border-dashboard-border p-5">
              <h3 className="font-playfair text-base font-bold text-dashboard-black mb-4">{t('analytics.leadStatus')}</h3>
              {!statusData.length ? (
                <p className="font-lato text-sm text-dashboard-secondary text-center py-8">{t('analytics.noLeadData')}</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={75} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#C9A84C" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Funnel' && (
        <div className="space-y-6" role="tabpanel" id="tabpanel-funnel" aria-labelledby="tab-funnel">
          {/* Conversion Funnel */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5">
            <h3 className="font-playfair text-base font-bold text-dashboard-black mb-5">{t('analytics.conversionFunnel')}</h3>
            {(() => {
              const funnelStages = [
                { key: 'new_lead', label: t('analytics.funnelNew'), color: '#3B82F6' },
                { key: 'contacted', label: t('analytics.funnelContacted'), color: '#06B6D4' },
                { key: 'appointment_set', label: t('analytics.funnelApptSet'), color: '#F59E0B' },
                { key: 'appointment_met', label: t('analytics.funnelApptMet'), color: '#10B981' },
                { key: 'active_client', label: t('analytics.funnelActive'), color: '#C9A84C' },
                { key: 'past_client', label: t('analytics.funnelClosed'), color: '#16A34A' },
              ];

              const statusCounts = new Map<string, number>();
              for (const lead of allLeads ?? []) {
                statusCounts.set(lead.status, (statusCounts.get(lead.status) ?? 0) + 1);
              }

              // Include attempted_contact in contacted count
              const contactedTotal = (statusCounts.get('contacted') ?? 0) + (statusCounts.get('attempted_contact') ?? 0);
              statusCounts.set('contacted', contactedTotal);

              // Include pending_client in active_client
              const activeTotal = (statusCounts.get('active_client') ?? 0) + (statusCounts.get('pending_client') ?? 0);
              statusCounts.set('active_client', activeTotal);

              const funnelData = funnelStages.map(s => ({
                ...s,
                count: statusCounts.get(s.key) ?? 0,
              }));

              const maxCount = Math.max(...funnelData.map(d => d.count), 1);

              if (maxCount <= 0) {
                return <EmptyState icon={Filter} title={t('analytics.noFunnelData')} description={t('analytics.noFunnelDesc')} />;
              }

              return (
                <div className="space-y-3">
                  {funnelData.map((stage, idx) => {
                    const barWidth = Math.max((stage.count / maxCount) * 100, 4);
                    const dropoff = idx > 0 && funnelData[idx - 1].count > 0
                      ? Math.round(((funnelData[idx - 1].count - stage.count) / funnelData[idx - 1].count) * 100)
                      : null;

                    return (
                      <div key={stage.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-lato text-sm text-dashboard-body">{stage.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-lato text-sm font-bold text-dashboard-black">{stage.count}</span>
                            {dropoff !== null && dropoff > 0 && (
                              <span className="font-lato text-[10px] text-score-hot">-{dropoff}%</span>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-8 bg-dashboard-surface rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${barWidth}%`, backgroundColor: stage.color }}
                          >
                            {stage.count > 0 && (
                              <span className="font-lato text-xs font-bold text-white">{stage.count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Commission Pipeline Forecast */}
          {forecast && forecast.totalDeals > 0 && (
            <div className="bg-white rounded-xl border border-dashboard-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={18} className="text-dashboard-gold" />
                <h3 className="font-playfair text-base font-bold text-dashboard-black">{t('analytics.pipelineForecast')}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-dashboard-surface rounded-lg p-3 text-center">
                  <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">{t('analytics.projectedRevenue')}</p>
                  <p className="font-playfair text-xl font-bold text-dashboard-gold">
                    ${forecast.projectedRevenue >= 1000 ? `${(forecast.projectedRevenue / 1000).toFixed(0)}K` : forecast.projectedRevenue.toFixed(0)}
                  </p>
                </div>
                <div className="bg-dashboard-surface rounded-lg p-3 text-center">
                  <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">{t('analytics.pipelineVolume')}</p>
                  <p className="font-playfair text-xl font-bold text-dashboard-black">
                    ${forecast.rawPipelineVolume >= 1_000_000 ? `${(forecast.rawPipelineVolume / 1_000_000).toFixed(1)}M` : `${(forecast.rawPipelineVolume / 1000).toFixed(0)}K`}
                  </p>
                </div>
                <div className="bg-dashboard-surface rounded-lg p-3 text-center">
                  <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">{t('analytics.totalDeals')}</p>
                  <p className="font-playfair text-xl font-bold text-dashboard-black">{forecast.totalDeals}</p>
                </div>
              </div>
              <div className="space-y-2">
                {forecast.byStage.map((s) => (
                  <div key={s.stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-lato text-xs text-dashboard-body">{s.label}</span>
                      <span className="font-lato text-[10px] text-dashboard-secondary">({Math.round(s.probability * 100)}%)</span>
                    </div>
                    <span className="font-lato text-xs font-bold text-dashboard-gold">
                      ${s.weightedCommission >= 1000 ? `${(s.weightedCommission / 1000).toFixed(0)}K` : s.weightedCommission.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lead Source ROI */}
          {sourceChartData.length > 0 && (
            <div className="bg-white rounded-xl border border-dashboard-border p-5">
              <h3 className="font-playfair text-base font-bold text-dashboard-black mb-4">{t('analytics.sourceROI')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dashboard-border">
                      <th className="text-left px-3 py-2 font-lato text-xs font-medium text-dashboard-secondary uppercase">{t('analytics.source')}</th>
                      <th className="text-right px-3 py-2 font-lato text-xs font-medium text-dashboard-secondary uppercase">{t('analytics.total')}</th>
                      <th className="text-right px-3 py-2 font-lato text-xs font-medium text-dashboard-secondary uppercase">{t('analytics.hot')}</th>
                      <th className="text-right px-3 py-2 font-lato text-xs font-medium text-dashboard-secondary uppercase">{t('analytics.conversion')}</th>
                      <th className="text-right px-3 py-2 font-lato text-xs font-medium text-dashboard-secondary uppercase">{t('analytics.avgScore')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashboard-border">
                    {sourceChartData.map((s) => {
                      // Compute avg score for this source
                      const sourceLeads = (allLeads ?? []).filter(l => l.source === s.name);
                      const avgScore = sourceLeads.length > 0
                        ? Math.round(sourceLeads.reduce((sum, l) => sum + l.score, 0) / sourceLeads.length)
                        : 0;
                      const convRate = s.total > 0 ? Math.round((s.hot / s.total) * 100) : 0;
                      const isBest = sourceChartData.every(other =>
                        other.name === s.name || (s.total > 0 && (s.hot / s.total) >= (other.total > 0 ? other.hot / other.total : 0))
                      );

                      return (
                        <tr key={s.name} className={`hover:bg-dashboard-surface/30 ${isBest && s.hot > 0 ? 'bg-dashboard-gold/5' : ''}`}>
                          <td className="px-3 py-2.5 font-lato text-sm text-dashboard-body capitalize">
                            {s.name.replace(/_/g, ' ')}
                            {isBest && s.hot > 0 && <span className="ml-1.5 text-dashboard-gold text-xs">★</span>}
                          </td>
                          <td className="px-3 py-2.5 font-lato text-sm text-dashboard-black text-right font-medium">{s.total}</td>
                          <td className="px-3 py-2.5 font-lato text-sm text-score-hot text-right">{s.hot}</td>
                          <td className="px-3 py-2.5 font-lato text-sm text-right">
                            <span className={convRate >= 30 ? 'text-status-success font-medium' : 'text-dashboard-secondary'}>
                              {convRate}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-lato text-sm text-dashboard-black text-right">{avgScore}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Leads' && (
        <div className="space-y-6" role="tabpanel" id="tabpanel-leads" aria-labelledby="tab-leads">
          {/* Source Stats */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5">
            <h3 className="font-playfair text-base font-bold text-dashboard-black mb-4">{t('analytics.leadSources')}</h3>
            {sourceLoading ? (
              <SkeletonCard />
            ) : !sourceChartData.length ? (
              <EmptyState icon={BarChart3} title={t('analytics.noSourceData')} description={t('analytics.noSourceDesc')} />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceChartData} margin={{ bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#C9A84C" name={t('analytics.total')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hot" fill="#DC2626" name={t('analytics.hot')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Source Table */}
          {sourceChartData.length > 0 && (
            <div className="bg-white rounded-xl border border-dashboard-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dashboard-border bg-dashboard-surface/50">
                    <th className="text-left px-4 py-3 font-lato text-xs font-medium text-dashboard-secondary uppercase">{t('analytics.source')}</th>
                    <th className="text-right px-4 py-3 font-lato text-xs font-medium text-dashboard-secondary uppercase">{t('analytics.total')}</th>
                    <th className="text-right px-4 py-3 font-lato text-xs font-medium text-dashboard-secondary uppercase">{t('analytics.hot')}</th>
                    <th className="text-right px-4 py-3 font-lato text-xs font-medium text-dashboard-secondary uppercase">{t('analytics.conversion')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashboard-border">
                  {sourceChartData.map((s) => (
                    <tr key={s.name} className="hover:bg-dashboard-surface/30">
                      <td className="px-4 py-3 font-lato text-sm text-dashboard-body capitalize">{s.name}</td>
                      <td className="px-4 py-3 font-lato text-sm text-dashboard-black text-right font-medium">{s.total}</td>
                      <td className="px-4 py-3 font-lato text-sm text-score-hot text-right">{s.hot}</td>
                      <td className="px-4 py-3 font-lato text-sm text-dashboard-secondary text-right">
                        {s.total > 0 ? `${Math.round((s.hot / s.total) * 100)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Automations' && (
        <div className="space-y-6" role="tabpanel" id="tabpanel-automations" aria-labelledby="tab-automations">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-dashboard-border p-5">
              <p className="font-lato text-xs text-dashboard-secondary">{t('analytics.activeSequences')}</p>
              <p className="font-playfair text-3xl font-bold text-dashboard-black mt-1">{automationStats?.totalSequences ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-dashboard-border p-5">
              <p className="font-lato text-xs text-dashboard-secondary">{t('analytics.activeEnrollments')}</p>
              <p className="font-playfair text-3xl font-bold text-dashboard-black mt-1">{automationStats?.activeEnrollments ?? 0}</p>
            </div>
          </div>
          {(automationStats?.totalSequences ?? 0) === 0 && (
            <EmptyState icon={BarChart3} title={t('analytics.noAutomationData')} description={t('analytics.noAutomationDesc')} />
          )}
        </div>
      )}
    </div>
  );
}
