import { useState, lazy, Suspense } from 'react';
import { FileText, MapPin } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonList } from '../../components/shared/Skeleton';
import { showToast } from '../../components/shared/Toast';
import { useCMAReports, useCreateCMAReport } from '../../hooks/useCMAReports';
import { useComparableSales } from '../../hooks/useComparableSales';
import { format } from 'date-fns';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useProfile } from '../../hooks/useProfile';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import { BUSINESS_EMAIL } from '../../constants';
import type { CMAPdfProps } from '../../components/dashboard/cma/CMAPdfDocument';

const CMAPdfButton = lazy(() =>
  import('../../components/dashboard/cma/CMAPdfButton').then(mod => ({
    default: mod.CMAPdfButton,
  }))
);

export default function CMA() {
  usePageTitle('CMA Generator');
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(2);
  const [sqft, setSqft] = useState(1800);
  const [yearBuilt, setYearBuilt] = useState(2000);
  const [step, setStep] = useState<'input' | 'comps' | 'result' | 'ai-result'>('input');
  const [aiResult, setAiResult] = useState<import('../../hooks/useCMAReports').CMAResult | null>(null);
  const [compCriteria, setCompCriteria] = useState<{
    subjectZip: string;
    subjectBeds: number;
    subjectSqft: number;
    subjectYearBuilt?: number;
  } | null>(null);
  const [selectedComps, setSelectedComps] = useState<Set<number>>(new Set());
  const { data: profile } = useProfile();
  const { data: reports, isLoading } = useCMAReports();
  const createReport = useCreateCMAReport();
  const { data: comparables = [], isLoading: compsLoading } = useComparableSales(compCriteria);

  const handleGenerate = () => {
    if (!address.trim()) return;
    createReport.mutate({ 
      address: address.trim(),
      beds,
      baths,
      sqft,
      year_built: yearBuilt,
    }, {
      onSuccess: (result) => { 
        showToast(t('cma.reportGenerated')); 
        setAiResult(result);
        setStep('ai-result');
      },
      onError: () => showToast(t('cma.reportFailed'), 'error'),
    });
  };

  const handleCompSearch = () => {
    if (!address.trim()) return;
    setCompCriteria({
      subjectZip: address.match(/\b\d{5}\b/)?.[0] || '79912',
      subjectBeds: beds,
      subjectSqft: sqft,
      subjectYearBuilt: yearBuilt,
    });
    setStep('comps');
  };

  const toggleComp = (index: number) => {
    setSelectedComps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const calculateEstimate = () => {
    const selected = comparables.filter((_, i) => selectedComps.has(i));
    if (selected.length === 0) return null;
    const subjectSqft = compCriteria?.subjectSqft || sqft;
    const avgPricePerSqft = selected.reduce((sum, c) => sum + (c.price / (c.sqft || 1)), 0) / selected.length;
    return {
      pricePerSqft: Math.round(avgPricePerSqft),
      estimated: Math.round(avgPricePerSqft * subjectSqft),
      low: Math.round(avgPricePerSqft * 0.95 * subjectSqft),
      high: Math.round(avgPricePerSqft * 1.05 * subjectSqft),
      compCount: selected.length,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('cma.title')}</h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">{t('cma.subtitle')}</p>
      </div>

      {/* CMA Input */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6 max-w-2xl">
        <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-4">{t('cma.newReport')}</h3>
        <div className="space-y-4">
          <div>
            <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('cma.propertyAddress')}</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dashboard-secondary" />
              <input
                type="text"
                placeholder={t('cma.addressPlaceholder')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body placeholder:text-dashboard-secondary focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('cma.beds')}</label>
              <input
                type="number"
                min={1}
                max={10}
                value={beds}
                onChange={(e) => setBeds(Number(e.target.value) || 1)}
                className="w-full px-3 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]"
              />
            </div>
            <div>
              <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('cma.baths')}</label>
              <input
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={baths}
                onChange={(e) => setBaths(Number(e.target.value) || 1)}
                className="w-full px-3 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]"
              />
            </div>
            <div>
              <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('cma.sqft')}</label>
              <input
                type="number"
                min={200}
                max={20000}
                step={100}
                value={sqft}
                onChange={(e) => setSqft(Number(e.target.value) || 1000)}
                className="w-full px-3 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]"
              />
            </div>
            <div>
              <label className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('cma.yearBuilt')}</label>
              <input
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                value={yearBuilt}
                onChange={(e) => setYearBuilt(Number(e.target.value) || 2000)}
                className="w-full px-3 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={!address.trim() || createReport.isPending}
              className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 disabled:cursor-not-allowed text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
            >
              {createReport.isPending ? t('cma.generating') : t('cma.generate')}
            </button>
            <button
              onClick={handleCompSearch}
              disabled={!address.trim()}
              className="px-6 py-2.5 border border-dashboard-gold text-dashboard-gold hover:bg-dashboard-gold hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
            >
              {t('cma.findComps')}
            </button>
          </div>
        </div>
      </div>

      {/* AI-Generated CMA Result */}
      {step === 'ai-result' && aiResult && (
        <div className="space-y-4">
          {/* Valuation Card */}
          <div className="bg-white rounded-xl border border-dashboard-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-playfair text-lg font-bold text-dashboard-black">AI CMA Results</h3>
              <button onClick={() => { setStep('input'); setAiResult(null); }} className="font-lato text-xs text-dashboard-secondary hover:text-dashboard-gold">
                New Report
              </button>
            </div>
            <p className="font-lato text-sm text-dashboard-secondary mb-4">{address} — {beds}bd/{baths}ba, {sqft?.toLocaleString()} sqft</p>

            {/* Price Range */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-dashboard-surface rounded-lg p-4">
                <p className="font-lato text-xs text-dashboard-secondary mb-1">Low Estimate</p>
                <p className="font-playfair text-xl font-bold text-dashboard-black">${aiResult.valuation.low.toLocaleString()}</p>
              </div>
              <div className="text-center bg-dashboard-gold/10 border-2 border-dashboard-gold rounded-lg p-4">
                <p className="font-lato text-xs text-dashboard-gold font-semibold mb-1">Estimated Value</p>
                <p className="font-playfair text-2xl font-bold text-dashboard-gold">${aiResult.valuation.estimated.toLocaleString()}</p>
              </div>
              <div className="text-center bg-dashboard-surface rounded-lg p-4">
                <p className="font-lato text-xs text-dashboard-secondary mb-1">High Estimate</p>
                <p className="font-playfair text-xl font-bold text-dashboard-black">${aiResult.valuation.high.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-6 text-sm mb-6">
              <div><span className="text-dashboard-secondary">$/sqft:</span> <span className="font-semibold">${aiResult.valuation.price_per_sqft}</span></div>
              <div><span className="text-dashboard-secondary">Avg DOM:</span> <span className="font-semibold">{aiResult.market.avg_days_on_market} days</span></div>
              <div><span className="text-dashboard-secondary">Comps:</span> <span className="font-semibold">{aiResult.comparable_sales.length} sales</span></div>
            </div>

            {/* AI Narrative */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">AI</span>
                </div>
                <p className="font-lato text-xs font-semibold text-purple-700">Claude Market Analysis</p>
              </div>
              <p className="font-lato text-sm text-dashboard-body leading-relaxed whitespace-pre-wrap">{aiResult.narrative}</p>
            </div>

            {/* Comparable Sales Table */}
            <div>
              <h4 className="font-playfair font-bold text-sm text-dashboard-black mb-3">Comparable Sales (Last 90 Days)</h4>
              <div className="space-y-2">
                {aiResult.comparable_sales.map((comp, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-dashboard-border last:border-0 text-sm">
                    <div>
                      <p className="font-lato font-medium text-dashboard-black">{comp.address}</p>
                      <p className="font-lato text-xs text-dashboard-secondary">{comp.beds}bd/{comp.baths}ba · {comp.sqft?.toLocaleString()} sqft · {comp.days_on_market} DOM · {comp.sold_date}</p>
                    </div>
                    <p className="font-playfair font-bold text-dashboard-black">${comp.sale_price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparable Sales Step */}
      {step === 'comps' && (
        <div className="bg-white rounded-xl border border-dashboard-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-playfair text-lg font-bold text-dashboard-black">{t('cma.comparables')}</h3>
            <button
              onClick={() => { setStep('input'); setCompCriteria(null); setSelectedComps(new Set()); }}
              className="font-lato text-xs text-dashboard-secondary hover:text-dashboard-gold"
            >
              {t('cma.backToSearch')}
            </button>
          </div>
          <p className="font-lato text-sm text-dashboard-secondary mb-4">
            {t('cma.compsDescription')}
          </p>
          {compsLoading ? (
            <SkeletonList count={5} />
          ) : comparables.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t('cma.noComps')}
              description={t('cma.noCompsDesc')}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dashboard-border">
                      <th className="text-left py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">{t('cma.include')}</th>
                      <th className="text-left py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">{t('cma.address')}</th>
                      <th className="text-right py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">{t('cma.price')}</th>
                      <th className="text-right py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">{t('cma.beds')}/{t('cma.baths')}</th>
                      <th className="text-right py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">{t('cma.sqft')}</th>
                      <th className="text-right py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">$/{t('cma.sqft')}</th>
                      <th className="text-right py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">{t('cma.dom')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashboard-border">
                    {comparables.map((comp, i) => (
                      <tr key={comp.id} className={`hover:bg-dashboard-surface/30 transition-colors ${selectedComps.has(i) ? 'bg-dashboard-gold/5' : ''}`}>
                        <td className="py-2 px-2">
                          <input
                            type="checkbox"
                            checked={selectedComps.has(i)}
                            onChange={() => toggleComp(i)}
                            className="accent-[#C9A84C] w-4 h-4"
                          />
                        </td>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-black truncate max-w-[200px]">{comp.address}</td>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-black text-right font-medium">${comp.price.toLocaleString()}</td>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-body text-right">{comp.beds}/{comp.baths}</td>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-body text-right">{comp.sqft.toLocaleString()}</td>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-body text-right">${comp.sqft ? Math.round(comp.price / comp.sqft) : '-'}</td>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-body text-right">{comp.daysOnMarket}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedComps.size > 0 && (
                <div className="mt-4 flex items-center justify-between p-4 bg-dashboard-surface rounded-lg">
                  <p className="font-lato text-sm text-dashboard-body">
                    <span className="font-bold text-dashboard-black">{selectedComps.size}</span> {t('cma.selected')}
                    {(() => {
                      const est = calculateEstimate();
                      if (!est) return null;
                      return (
                        <span className="text-dashboard-secondary"> — Est. <span className="font-bold text-dashboard-gold">${est.estimated.toLocaleString()}</span></span>
                      );
                    })()}
                  </p>
                  <button
                    onClick={() => setStep('result')}
                    className="px-5 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
                  >
                    {t('cma.viewResults')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Result Step — Full CMA Summary */}
      {step === 'result' && (() => {
        const est = calculateEstimate();
        const selectedCompsList = comparables.filter((_, i) => selectedComps.has(i));
        const subjectBeds = compCriteria?.subjectBeds || beds;
        const subjectSqft = compCriteria?.subjectSqft || sqft;
        const subjectYearBuilt = compCriteria?.subjectYearBuilt || yearBuilt;

        if (!est) {
          return (
            <div className="bg-white rounded-xl border border-dashboard-border p-6 text-center">
              <p className="font-lato text-sm text-dashboard-secondary">{t('cma.noCompsSelected')}</p>
              <button
                onClick={() => setStep('comps')}
                className="mt-3 px-5 py-2.5 border border-dashboard-gold text-dashboard-gold hover:bg-dashboard-gold hover:text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
              >
                {t('cma.backToComps')}
              </button>
            </div>
          );
        }

        const pdfData: CMAPdfProps = {
          agentName: profile?.full_name || 'Lorena Ontiveros-Ortega',
          agentPhone: profile?.phone || '(915) 500-0573',
          agentEmail: profile?.email || BUSINESS_EMAIL,
          clientName: 'Valued Client',
          subjectProperty: {
            address: address || 'Subject Property',
            beds: subjectBeds,
            baths: baths,
            sqft: subjectSqft,
            yearBuilt: subjectYearBuilt,
          },
          comparables: selectedCompsList.map(c => ({
            address: c.address,
            beds: c.beds,
            baths: c.baths,
            sqft: c.sqft,
            salePrice: c.price,
            pricePerSqft: c.sqft ? Math.round(c.price / c.sqft) : 0,
            soldDate: c.closeDate ? format(new Date(c.closeDate), 'MM/dd/yyyy') : 'N/A',
            daysOnMarket: c.daysOnMarket,
          })),
          estimatedValue: est.estimated,
          estimatedLow: est.low,
          estimatedHigh: est.high,
          generatedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        };

        return (
          <div className="bg-white rounded-xl border border-dashboard-border p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-playfair text-lg font-bold text-dashboard-black">{t('cma.results')}</h3>
              <button
                onClick={() => setStep('comps')}
                className="font-lato text-xs text-dashboard-secondary hover:text-dashboard-gold"
              >
                {t('cma.backToComps')}
              </button>
            </div>

            {/* Subject Property Summary */}
            <div className="bg-dashboard-surface rounded-lg p-4">
              <p className="font-lato text-xs text-dashboard-secondary uppercase tracking-wide mb-2">{t('cma.subjectProperty')}</p>
              <p className="font-lato text-sm font-medium text-dashboard-black">{address || t('cma.subjectProperty')}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                <span className="font-lato text-xs text-dashboard-body">{subjectBeds} {t('cma.beds').toLowerCase()}</span>
                <span className="font-lato text-xs text-dashboard-body">{baths} {t('cma.baths').toLowerCase()}</span>
                <span className="font-lato text-xs text-dashboard-body">{subjectSqft.toLocaleString()} {t('cma.sqft').toLowerCase()}</span>
                <span className="font-lato text-xs text-dashboard-body">{t('cma.yearBuilt')} {subjectYearBuilt}</span>
              </div>
            </div>

            {/* Estimated Value */}
            <div className="text-center py-4 border-y border-dashboard-border">
              <p className="font-lato text-xs text-dashboard-secondary uppercase tracking-wide">{t('cma.estimatedMarketValue')}</p>
              <p className="font-playfair text-4xl font-bold text-dashboard-gold mt-2">${est.estimated.toLocaleString()}</p>
              <p className="font-lato text-sm text-dashboard-secondary mt-2">
                {t('cma.range')}: ${est.low.toLocaleString()} — ${est.high.toLocaleString()}
              </p>
              <p className="font-lato text-xs text-dashboard-secondary mt-1">
                {t('cma.basedOn')} {est.compCount} {t('cma.comparableSales')} — ${est.pricePerSqft}/{t('cma.sqft')} avg.
              </p>
            </div>

            {/* Selected Comps Summary Table */}
            <div>
              <p className="font-lato text-xs text-dashboard-secondary uppercase tracking-wide mb-3">{t('cma.selectedComparables')} ({selectedCompsList.length})</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dashboard-border">
                      <th className="text-left py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">{t('cma.address')}</th>
                      <th className="text-right py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">{t('cma.soldPrice')}</th>
                      <th className="text-right py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">$/{t('cma.sqft')}</th>
                      <th className="text-right py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">{t('cma.beds')}/{t('cma.baths')}</th>
                      <th className="text-right py-2 px-2 font-lato text-xs text-dashboard-secondary uppercase">{t('cma.sqft')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashboard-border">
                    {selectedCompsList.map((comp) => (
                      <tr key={comp.id}>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-black truncate max-w-[200px]">{comp.address}</td>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-black text-right font-medium">${comp.price.toLocaleString()}</td>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-body text-right">${comp.sqft ? Math.round(comp.price / comp.sqft) : '-'}</td>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-body text-right">{comp.beds}/{comp.baths}</td>
                        <td className="py-2 px-2 font-lato text-sm text-dashboard-body text-right">{comp.sqft.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generate PDF */}
            <div className="flex justify-center pt-2">
              <Suspense
                fallback={
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-dashboard-gold/50 text-white font-lato font-medium text-sm rounded-lg min-h-[44px] cursor-wait"
                  >
                    {t('cma.loadingPdf')}
                  </button>
                }
              >
                <CMAPdfButton data={pdfData} />
              </Suspense>
            </div>
          </div>
        );
      })()}

      {/* Previous CMAs */}
      <div>
        <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-4">{t('cma.previousReports')}</h3>
        {isLoading ? (
          <SkeletonList count={3} />
        ) : !reports?.length ? (
          <EmptyState
            icon={FileText}
            title={t('cma.noReports')}
            description={t('cma.noReportsDesc')}
          />
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl border border-dashboard-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-lato text-sm font-medium text-dashboard-black">{report.address}</p>
                    <p className="font-lato text-xs text-dashboard-secondary mt-0.5">
                      Generated {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-lato font-medium ${
                    report.status === 'complete' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {report.status}
                  </span>
                </div>
                {report.estimated_value && (
                  <p className="font-lato text-sm text-dashboard-gold font-medium mt-2">
                    Est. Value: ${report.estimated_value.toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
