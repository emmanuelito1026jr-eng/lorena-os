import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, TrendingUp, Shield, ArrowRight } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

const ServicesTabbed = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    {
      id: 'buyers',
      label: t('servicesTabs.buyingLabel'),
      icon: Home,
      steps: [
        { number: '01', title: t('servicesTabs.buying.step1Title'), description: t('servicesTabs.buying.step1Desc') },
        { number: '02', title: t('servicesTabs.buying.step2Title'), description: t('servicesTabs.buying.step2Desc') },
        { number: '03', title: t('servicesTabs.buying.step3Title'), description: t('servicesTabs.buying.step3Desc') },
        { number: '04', title: t('servicesTabs.buying.step4Title'), description: t('servicesTabs.buying.step4Desc') },
      ],
      cta: { text: t('servicesTabs.buying.cta'), to: '/properties' },
    },
    {
      id: 'sellers',
      label: t('servicesTabs.sellingLabel'),
      icon: TrendingUp,
      steps: [
        { number: '01', title: t('servicesTabs.selling.step1Title'), description: t('servicesTabs.selling.step1Desc') },
        { number: '02', title: t('servicesTabs.selling.step2Title'), description: t('servicesTabs.selling.step2Desc') },
        { number: '03', title: t('servicesTabs.selling.step3Title'), description: t('servicesTabs.selling.step3Desc') },
        { number: '04', title: t('servicesTabs.selling.step4Title'), description: t('servicesTabs.selling.step4Desc') },
      ],
      cta: { text: t('servicesTabs.selling.cta'), to: '/sellers' },
    },
    {
      id: 'military',
      label: t('servicesTabs.militaryLabel'),
      icon: Shield,
      steps: [
        { number: '01', title: t('servicesTabs.military.step1Title'), description: t('servicesTabs.military.step1Desc') },
        { number: '02', title: t('servicesTabs.military.step2Title'), description: t('servicesTabs.military.step2Desc') },
        { number: '03', title: t('servicesTabs.military.step3Title'), description: t('servicesTabs.military.step3Desc') },
        { number: '04', title: t('servicesTabs.military.step4Title'), description: t('servicesTabs.military.step4Desc') },
      ],
      cta: { text: t('servicesTabs.military.cta'), to: '/about/military' },
    },
  ];

  const tab = TABS[activeTab];

  return (
    <section className="py-20 md:py-28 bg-warm-ivory">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-lato font-semibold">{t('servicesTabs.subtitle')}</span>
          <h2 className="mt-2 font-playfair text-3xl md:text-4xl font-bold text-dark">{t('servicesTabs.title')}</h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center gap-2 md:gap-4 mb-12">
          {TABS.map((tabItem, i) => (
            <button
              key={tabItem.id}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-lato font-semibold text-sm uppercase tracking-wider transition-all ${
                i === activeTab
                  ? 'bg-gold text-white shadow-gold-glow'
                  : 'bg-white text-gray-600 hover:text-gold border border-gray-200'
              }`}
            >
              <tabItem.icon size={16} />
              <span className="hidden md:inline">{tabItem.label}</span>
              <span className="md:hidden">{tabItem.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tab.steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                  <span className="font-playfair font-bold text-gold">{step.number}</span>
                </div>
                <div>
                  <h3 className="font-playfair text-lg font-bold text-dark mb-1">{step.title}</h3>
                  <p className="font-lato text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to={tab.cta.to}
              className="inline-flex items-center gap-2 bg-gold text-white rounded-full px-8 py-3 font-lato font-semibold text-sm uppercase tracking-widest hover:bg-gold-dark transition-all"
            >
              {tab.cta.text} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesTabbed;
