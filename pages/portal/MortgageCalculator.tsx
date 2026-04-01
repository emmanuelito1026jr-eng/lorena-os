import { useState, useMemo } from 'react';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import { BUSINESS_EMAIL } from '../../constants';

const inputClass = 'w-full px-3 py-2.5 border border-[#E5E5E0] rounded-lg font-lato text-sm text-[#333333] placeholder:text-[#888888] focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20 min-h-[44px]';

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function MortgageCalculator() {
  usePageTitle('Mortgage Calculator');
  const { t } = useTranslation();
  const [homePrice, setHomePrice] = useState(250000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [propertyTax, setPropertyTax] = useState(3500);
  const [insurance, setInsurance] = useState(1200);
  const [hoa, setHoa] = useState(0);

  const calc = useMemo(() => {
    const downPayment = homePrice * (downPaymentPct / 100);
    const principal = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;

    let monthlyPI: number;
    if (monthlyRate === 0) {
      monthlyPI = principal / numPayments;
    } else {
      monthlyPI = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const monthlyTax = propertyTax / 12;
    const monthlyInsurance = insurance / 12;
    const monthlyHOA = hoa;
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyHOA;
    const totalInterest = (monthlyPI * numPayments) - principal;

    return {
      downPayment,
      principal,
      monthlyPI: Math.round(monthlyPI),
      monthlyTax: Math.round(monthlyTax),
      monthlyInsurance: Math.round(monthlyInsurance),
      monthlyHOA,
      totalMonthly: Math.round(totalMonthly),
      totalInterest: Math.round(totalInterest),
      totalCost: Math.round(monthlyPI * numPayments + propertyTax * loanTerm + insurance * loanTerm + hoa * 12 * loanTerm),
    };
  }, [homePrice, downPaymentPct, interestRate, loanTerm, propertyTax, insurance, hoa]);

  // Pie chart data for breakdown
  const piData = [
    { label: t('portal.calculator.principalInterest'), value: calc.monthlyPI, color: '#C9A84C' },
    { label: t('portal.calculator.propertyTax'), value: calc.monthlyTax, color: '#2563EB' },
    { label: t('portal.calculator.insurance'), value: calc.monthlyInsurance, color: '#16A34A' },
    ...(calc.monthlyHOA > 0 ? [{ label: t('portal.calculator.hoa'), value: calc.monthlyHOA, color: '#9CA3AF' }] : []),
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('portal.calculator.title')}</h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">{t('portal.calculator.subtitle')}</p>
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6 space-y-4">
        <div>
          <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.calculator.homePrice')}</label>
          <div className="relative">
            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="number"
              value={homePrice}
              onChange={e => setHomePrice(Number(e.target.value))}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.calculator.downPayment')}</label>
            <div className="relative">
              <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
              <input
                type="number"
                value={downPaymentPct}
                onChange={e => setDownPaymentPct(Number(e.target.value))}
                min={0}
                max={100}
                className={`${inputClass} pl-9`}
              />
            </div>
            <p className="font-lato text-[10px] text-dashboard-secondary mt-1">{formatCurrency(calc.downPayment)}</p>
          </div>
          <div>
            <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.calculator.interestRate')}</label>
            <div className="relative">
              <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
              <input
                type="number"
                step="0.125"
                value={interestRate}
                onChange={e => setInterestRate(Number(e.target.value))}
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.calculator.loanTerm')}</label>
          <div className="flex gap-2">
            {[15, 20, 30].map(term => (
              <button
                key={term}
                onClick={() => setLoanTerm(term)}
                className={`flex-1 py-2.5 rounded-lg font-lato text-sm font-medium transition-colors min-h-[44px] ${
                  loanTerm === term
                    ? 'bg-[#C9A84C] text-white'
                    : 'bg-dashboard-surface text-dashboard-body border border-dashboard-border hover:border-[#C9A84C]/50'
                }`}
              >
                {term} {t('portal.calculator.years')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.calculator.annualTax')}</label>
            <input
              type="number"
              value={propertyTax}
              onChange={e => setPropertyTax(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.calculator.annualInsurance')}</label>
            <input
              type="number"
              value={insurance}
              onChange={e => setInsurance(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.calculator.monthlyHOA')}</label>
            <input
              type="number"
              value={hoa}
              onChange={e => setHoa(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="bg-gradient-to-br from-dashboard-gold/10 to-dashboard-gold/5 rounded-xl border border-dashboard-gold/20 p-6 text-center">
        <Calculator size={24} className="text-dashboard-gold mx-auto mb-2" />
        <p className="font-lato text-xs text-dashboard-secondary uppercase tracking-wide">{t('portal.calculator.estimatedMonthly')}</p>
        <p className="font-playfair text-4xl font-bold text-dashboard-gold mt-1">{formatCurrency(calc.totalMonthly)}</p>
        <p className="font-lato text-xs text-dashboard-secondary mt-2">
          {formatCurrency(calc.principal)} loan · {loanTerm}-year fixed · {interestRate}%
        </p>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6">
        <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-4">{t('portal.calculator.monthlyBreakdown')}</h3>
        <div className="space-y-3">
          {piData.map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-lato text-sm text-dashboard-body">{item.label}</span>
              </div>
              <span className="font-lato text-sm font-medium text-dashboard-black">{formatCurrency(item.value)}/mo</span>
            </div>
          ))}
          <div className="border-t border-dashboard-border pt-3 flex items-center justify-between">
            <span className="font-lato text-sm font-semibold text-dashboard-black">{t('portal.calculator.total')}</span>
            <span className="font-playfair text-lg font-bold text-dashboard-gold">{formatCurrency(calc.totalMonthly)}/mo</span>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-dashboard-border p-4 text-center">
          <Calendar size={18} className="text-dashboard-gold mx-auto mb-1" />
          <p className="font-lato text-[10px] text-dashboard-secondary uppercase">{t('portal.calculator.totalInterest')}</p>
          <p className="font-playfair text-lg font-bold text-dashboard-black">{formatCurrency(calc.totalInterest)}</p>
        </div>
        <div className="bg-white rounded-xl border border-dashboard-border p-4 text-center">
          <DollarSign size={18} className="text-dashboard-gold mx-auto mb-1" />
          <p className="font-lato text-[10px] text-dashboard-secondary uppercase">{t('portal.calculator.totalCost')}</p>
          <p className="font-playfair text-lg font-bold text-dashboard-black">{formatCurrency(calc.totalCost)}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6 text-center">
        <p className="font-playfair text-lg font-bold text-dashboard-black mb-1">{t('portal.calculator.preApprovedTitle')}</p>
        <p className="font-lato text-sm text-dashboard-secondary mb-4">
          {t('portal.calculator.preApprovedDesc')}
        </p>
        <a
          href={`mailto:${BUSINESS_EMAIL}?subject=Mortgage%20Pre-Approval%20Inquiry`}
          className="inline-block px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
        >
          {t('portal.calculator.askLorena')}
        </a>
      </div>
    </div>
  );
}
