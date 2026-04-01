import { useState } from 'react';
import { Home, MapPin, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { SkeletonCard } from '../../components/shared/Skeleton';
import { showToast } from '../../components/shared/Toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import { BUSINESS_EMAIL } from '../../constants';

interface EstimateResult {
  estimated: number;
  low: number;
  high: number;
  pricePerSqft: number;
  comps: Array<{ address: string; price: number; sqft: number; beds: number; baths: number; close_date: string }>;
}

const inputClass = 'w-full px-3 py-2.5 border border-[#E5E5E0] rounded-lg font-lato text-sm text-[#333333] placeholder:text-[#888888] focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20 min-h-[44px]';

export default function HomeValueEstimate() {
  usePageTitle('Home Value');
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [zip, setZip] = useState('');
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(2);
  const [sqft, setSqft] = useState(1800);
  const [yearBuilt, setYearBuilt] = useState(2000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);

  const handleEstimate = async () => {
    if (!zip || !sqft) {
      showToast('Please enter ZIP code and square footage', 'error');
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      // Query sold listings in same zip, similar beds, sold within 180 days
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      let query = supabase
        .from('listings')
        .select('address, list_price, sqft, beds, baths, close_date, close_price')
        .eq('status', 'sold')
        .eq('zip_code', zip)
        .gte('close_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('close_date', { ascending: false })
        .limit(10);

      if (beds) {
        query = query.gte('beds', beds - 1).lte('beds', beds + 1);
      }

      const { data: comps } = await query;

      if (!comps || comps.length === 0) {
        // Fallback: try without bed filter
        const { data: fallbackComps } = await supabase
          .from('listings')
          .select('address, list_price, sqft, beds, baths, close_date, close_price')
          .eq('status', 'sold')
          .eq('zip_code', zip)
          .order('close_date', { ascending: false })
          .limit(5);

        if (!fallbackComps || fallbackComps.length === 0) {
          showToast('No comparable sales found for this area', 'error');
          setLoading(false);
          return;
        }

        calculateResult(fallbackComps);
      } else {
        calculateResult(comps);
      }
    } catch {
      showToast('Error calculating estimate', 'error');
    }
    setLoading(false);
  };

  const calculateResult = (comps: Array<{ address: string; list_price: number; sqft: number | null; beds: number | null; baths: number | null; close_date: string | null; close_price: number | null }>) => {
    const validComps = comps.filter(c => (c.close_price || c.list_price) && c.sqft && c.sqft > 0);
    if (validComps.length === 0) {
      showToast('No valid comparables found', 'error');
      return;
    }

    const avgPricePerSqft = validComps.reduce((sum, c) => sum + ((c.close_price || c.list_price) / (c.sqft || 1)), 0) / validComps.length;
    const estimated = Math.round(avgPricePerSqft * sqft);

    setResult({
      estimated,
      low: Math.round(estimated * 0.9),
      high: Math.round(estimated * 1.1),
      pricePerSqft: Math.round(avgPricePerSqft),
      comps: validComps.slice(0, 3).map(c => ({
        address: c.address,
        price: c.close_price || c.list_price,
        sqft: c.sqft || 0,
        beds: c.beds || 0,
        baths: c.baths || 0,
        close_date: c.close_date || '',
      })),
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('portal.homeValue.title')}</h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">{t('portal.homeValue.subtitle')}</p>
      </div>

      {/* Input form */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6 space-y-4">
        <div>
          <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.homeValue.propertyAddress')}</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input type="text" placeholder={t('portal.addressPlaceholder')} value={address} onChange={e => setAddress(e.target.value)} className={`${inputClass} pl-9`} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.homeValue.zipCode')}</label>
            <input type="text" placeholder={t('portal.zipPlaceholder')} value={zip} onChange={e => setZip(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.homeValue.beds')}</label>
            <input type="number" value={beds} onChange={e => setBeds(Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.homeValue.baths')}</label>
            <input type="number" value={baths} onChange={e => setBaths(Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.homeValue.sqft')}</label>
            <input type="number" placeholder={t('portal.sqftPlaceholder')} value={sqft} onChange={e => setSqft(Number(e.target.value))} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.homeValue.yearBuilt')}</label>
            <input type="number" placeholder={t('portal.yearBuiltPlaceholder')} value={yearBuilt} onChange={e => setYearBuilt(Number(e.target.value))} className={inputClass} />
          </div>
        </div>
        <button
          onClick={handleEstimate}
          disabled={loading || !zip || !sqft}
          className="w-full py-2.5 bg-[#C9A84C] hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
        >
          {loading ? t('portal.homeValue.calculating') : t('portal.homeValue.getEstimate')}
        </button>
      </div>

      {/* Loading */}
      {loading && <SkeletonCard />}

      {/* Result */}
      {result && (
        <>
          <div className="bg-gradient-to-br from-dashboard-gold/10 to-dashboard-gold/5 rounded-xl border border-dashboard-gold/20 p-6 text-center">
            <TrendingUp size={24} className="text-dashboard-gold mx-auto mb-2" />
            <p className="font-lato text-xs text-dashboard-secondary uppercase tracking-wide">{t('portal.homeValue.estimatedValue')}</p>
            <p className="font-playfair text-4xl font-bold text-dashboard-gold mt-1">${result.estimated.toLocaleString()}</p>
            <p className="font-lato text-sm text-dashboard-secondary mt-2">
              {t('portal.homeValue.range')}: ${result.low.toLocaleString()} — ${result.high.toLocaleString()}
            </p>
            <p className="font-lato text-xs text-dashboard-secondary mt-1">
              ${result.pricePerSqft}/sqft based on {result.comps.length} comparable sales
            </p>
          </div>

          {/* Comps */}
          {result.comps.length > 0 && (
            <div>
              <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-3">{t('portal.homeValue.comparableSales')}</h3>
              <div className="space-y-2">
                {result.comps.map((comp, i) => (
                  <div key={i} className="bg-white rounded-xl border border-dashboard-border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-lato text-sm text-dashboard-body">{comp.address}</p>
                      <p className="font-lato text-xs text-dashboard-secondary">
                        {comp.beds} bd · {comp.baths} ba · {comp.sqft.toLocaleString()} sqft
                        {comp.close_date && ` · Sold ${new Date(comp.close_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <p className="font-playfair text-lg font-bold text-dashboard-gold">${comp.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-white rounded-xl border border-dashboard-border p-6 text-center">
            <Home size={24} className="text-dashboard-gold mx-auto mb-2" />
            <p className="font-playfair text-lg font-bold text-dashboard-black mb-1">{t('portal.homeValue.wantCMA')}</p>
            <p className="font-lato text-sm text-dashboard-secondary mb-4">
              {t('portal.homeValue.cmaDesc')}
            </p>
            <a
              href={`mailto:${BUSINESS_EMAIL}?subject=CMA%20Request&body=Hi%20Lorena%2C%20I'd%20like%20a%20CMA%20for%20${encodeURIComponent(address || 'my property')}`}
              className="inline-block px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
            >
              {t('portal.homeValue.requestCMA')}
            </a>
          </div>

          {/* Disclaimer */}
          <p className="font-lato text-[10px] text-dashboard-secondary text-center">
            {t('portal.homeValue.disclaimer')}
          </p>
        </>
      )}
    </div>
  );
}
