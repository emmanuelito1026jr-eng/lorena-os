import React, { useState, useMemo } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { useTranslation } from '../lib/i18n';
import { PHONE_NUMBER, REALTOR_NAME } from '../constants';
import { Home, BarChart3, Calendar, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

type Condition = 'Excellent' | 'Good' | 'Fair' | 'Needs Work';

interface SellerFormData {
  address: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  yearBuilt: string;
  condition: Condition;
  upgrades: string[];
  name: string;
  email: string;
  phone: string;
}

const UPGRADE_OPTIONS = [
  'Kitchen',
  'Bathrooms',
  'Roof',
  'Flooring',
  'HVAC',
] as const;

const STEPS = [
  {
    icon: Home,
    title: 'Enter Your Details',
    description: 'Tell us about your property — address, size, condition, and recent upgrades.',
  },
  {
    icon: BarChart3,
    title: 'Get Your Estimate',
    description: 'Our AI-powered algorithm instantly calculates your home\'s estimated market value.',
  },
  {
    icon: Calendar,
    title: 'Schedule a Consultation',
    description: 'Meet with Lorena for a professional walkthrough and detailed comparative market analysis.',
  },
];

const VALUE_PROPS = [
  {
    title: 'Fast Sales, Top Dollar',
    description: 'Strategic pricing backed by real market data to sell your home quickly — without leaving money on the table.',
  },
  {
    title: 'Professional Photography & Staging',
    description: 'High-quality photos, virtual tours, and staging guidance that make your listing stand out from the competition.',
  },
  {
    title: 'Bilingual Marketing Reach',
    description: 'Your listing is marketed to buyers on both sides of the border in English and Spanish, maximizing your exposure.',
  },
];

const Sellers = () => {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Sell Your El Paso Home',
    description: 'Get a free home valuation and expert selling strategy from Lorena Ontiveros-Ortega. Bilingual marketing to maximize your El Paso home sale price.',
    canonicalUrl: 'https://casasenelpasotx.com/sellers',
  });

  const [formData, setFormData] = useState<SellerFormData>({
    address: '',
    bedrooms: '3',
    bathrooms: '2',
    squareFeet: '',
    yearBuilt: '',
    condition: 'Good',
    upgrades: [],
    name: '',
    email: '',
    phone: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [showEstimate, setShowEstimate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedValue = useMemo(() => {
    const sqft = parseInt(formData.squareFeet) || 0;
    const yearBuilt = parseInt(formData.yearBuilt) || 0;

    if (sqft === 0 || yearBuilt === 0) return 0;

    const basePricePerSqFt = 150;
    let baseValue = sqft * basePricePerSqFt;

    const conditionMultiplier: Record<Condition, number> = {
      'Excellent': 1.15,
      'Good': 1.0,
      'Fair': 0.9,
      'Needs Work': 0.75,
    };
    baseValue *= conditionMultiplier[formData.condition];

    const age = new Date().getFullYear() - yearBuilt;
    if (age < 5) baseValue *= 1.1;
    else if (age > 30) baseValue *= 0.9;

    return Math.round(baseValue / 1000) * 1000;
  }, [formData.squareFeet, formData.yearBuilt, formData.condition]);

  const estimatedLow = useMemo(() => Math.round((estimatedValue * 0.9) / 1000) * 1000, [estimatedValue]);
  const estimatedHigh = useMemo(() => Math.round((estimatedValue * 1.1) / 1000) * 1000, [estimatedValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setShowEstimate(false);
  };

  const handleUpgradeToggle = (upgrade: string) => {
    setFormData(prev => ({
      ...prev,
      upgrades: prev.upgrades.includes(upgrade)
        ? prev.upgrades.filter(u => u !== upgrade)
        : [...prev.upgrades, upgrade],
    }));
  };

  const handleCalculate = () => {
    if (formData.squareFeet && formData.yearBuilt) {
      setShowEstimate(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
      if (webhookUrl && !webhookUrl.includes('your-n8n-instance')) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            estimatedValue,
            estimatedRange: { low: estimatedLow, high: estimatedHigh },
            source: 'seller-valuation',
            type: 'Seller Valuation',
            timestamp: new Date().toISOString(),
          }),
        });
      } else {
        const { supabase } = await import('../lib/supabase/client');
        const nameParts = formData.name.trim().split(/\s+/);
        const { data: agent } = await supabase
          .from('profiles').select('id').eq('role', 'agent').limit(1).single();
        await supabase.from('leads').insert({
          first_name: nameParts[0] || 'Seller',
          last_name: nameParts.slice(1).join(' ') || 'Lead',
          email: formData.email || null,
          phone: formData.phone || null,
          source: 'website' as const,
          tags: ['seller-valuation'],
          preferred_language: 'en',
          notes: `Seller Valuation: ${formData.address}. ${formData.bedrooms}bd/${formData.bathrooms}ba, ${formData.squareFeet}sqft. Est. value: $${estimatedValue?.toLocaleString()} ($${estimatedLow?.toLocaleString()}-$${estimatedHigh?.toLocaleString()})`,
          agent_id: agent?.id,
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit your request. Please try again or call us directly at (915) 487-5581.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pb-28 px-4 bg-gradient-to-br from-dark to-dark-100 overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-gold/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <Home className="text-gold mx-auto mb-6" size={56} />
          <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold text-gold mb-6 leading-tight">
            What&apos;s Your El Paso<br className="hidden md:block" /> Home Worth?
          </h1>
          <p className="font-lato text-lg md:text-xl text-warm-white/80 max-w-2xl mx-auto">
            Get a free, AI-powered home valuation in minutes.
          </p>
        </div>
      </section>

      {/* Valuation Form */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-premium border border-gray-200 rounded-lg p-6 md:p-12"
          >
            {!submitted ? (
              <>
                <h2 className="font-playfair text-3xl md:text-4xl text-dark mb-2">
                  Property Details
                </h2>
                <p className="font-lato text-dark/60 mb-8">
                  Enter your home&apos;s information for an instant estimate.
                </p>

                {/* Address */}
                <div className="mb-6">
                  <label className="block text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                    Property Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-all font-lato"
                    placeholder={t('sellers.addressPlaceholder')}
                  />
                </div>

                {/* Property Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* Bedrooms */}
                  <div>
                    <label className="block text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                      Bedrooms
                    </label>
                    <select
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-all font-lato"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5+">5+</option>
                    </select>
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <label className="block text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                      Bathrooms
                    </label>
                    <select
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-all font-lato"
                    >
                      <option value="1">1</option>
                      <option value="1.5">1.5</option>
                      <option value="2">2</option>
                      <option value="2.5">2.5</option>
                      <option value="3">3</option>
                      <option value="3.5">3.5</option>
                      <option value="4+">4+</option>
                    </select>
                  </div>

                  {/* Square Feet */}
                  <div>
                    <label className="block text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                      Sq Ft
                    </label>
                    <input
                      type="number"
                      name="squareFeet"
                      value={formData.squareFeet}
                      onChange={handleChange}
                      required
                      min="400"
                      max="15000"
                      placeholder={t('sellers.sqftPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-all font-lato"
                    />
                  </div>

                  {/* Year Built */}
                  <div>
                    <label className="block text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                      Year Built
                    </label>
                    <input
                      type="number"
                      name="yearBuilt"
                      value={formData.yearBuilt}
                      onChange={handleChange}
                      required
                      min="1900"
                      max={new Date().getFullYear()}
                      placeholder={t('sellers.yearBuiltPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-all font-lato"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div className="mb-6">
                  <label className="block text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                    Property Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-all font-lato"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Work">Needs Work</option>
                  </select>
                </div>

                {/* Recent Upgrades */}
                <div className="mb-8">
                  <label className="block text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-3">
                    Recent Upgrades
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {UPGRADE_OPTIONS.map(upgrade => {
                      const isSelected = formData.upgrades.includes(upgrade);
                      return (
                        <button
                          key={upgrade}
                          type="button"
                          onClick={() => handleUpgradeToggle(upgrade)}
                          className={`px-4 py-2.5 rounded border text-sm font-lato font-medium transition-all min-h-[44px] ${
                            isSelected
                              ? 'bg-gold text-dark border-gold'
                              : 'bg-white text-dark/70 border-gray-200 hover:border-gold/60'
                          }`}
                        >
                          {isSelected && <CheckCircle size={14} className="inline mr-1.5 -mt-0.5" />}
                          {upgrade}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calculate Button */}
                {!showEstimate && (
                  <button
                    type="button"
                    onClick={handleCalculate}
                    disabled={!formData.squareFeet || !formData.yearBuilt}
                    className="w-full px-8 py-4 bg-dark text-gold font-lato font-bold uppercase tracking-widest rounded hover:bg-dark-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-8"
                  >
                    Calculate Estimate
                  </button>
                )}

                {/* Estimated Value Display */}
                {showEstimate && estimatedValue > 0 && (
                  <div className="mb-10 p-8 bg-gradient-to-br from-gold/10 to-gold/5 border-2 border-gold rounded-lg text-center">
                    <p className="text-dark/60 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                      Estimated Value Range
                    </p>
                    <p className="font-playfair text-4xl md:text-5xl font-bold text-dark mb-1">
                      ${estimatedLow.toLocaleString()} &ndash; ${estimatedHigh.toLocaleString()}
                    </p>
                    <p className="text-dark/50 text-xs font-lato mt-3">
                      *This is a preliminary estimate based on El Paso market averages.
                      Contact {REALTOR_NAME} for a professional comparative market analysis.
                    </p>
                  </div>
                )}

                {/* Contact Info Section */}
                <h2 className="font-playfair text-3xl text-dark mb-2 mt-4">
                  Your Information
                </h2>
                <p className="font-lato text-dark/60 mb-8">
                  We&apos;ll send your detailed valuation report and schedule a consultation.
                </p>

                <div className="space-y-5 mb-8">
                  <div>
                    <label
                      htmlFor="seller-name"
                      className="block text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      id="seller-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder={t('sellers.namePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-all font-lato"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="seller-email"
                      className="block text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="seller-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder={t('sellers.emailPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-all font-lato"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="seller-phone"
                      className="block text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2"
                    >
                      Phone Number
                    </label>
                    <input
                      id="seller-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder={t('sellers.phonePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-all font-lato"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 font-lato text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-8 py-4 bg-gold text-dark font-lato font-bold uppercase tracking-widest rounded hover:shadow-gold-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px]"
                >
                  {isSubmitting ? 'Submitting...' : 'Get My Free Valuation'}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </>
            ) : (
              <div className="text-center py-16">
                <CheckCircle className="text-gold mx-auto mb-6" size={64} />
                <h2 className="font-playfair text-3xl md:text-4xl text-dark mb-4">
                  Thank You!
                </h2>

                {showEstimate && estimatedValue > 0 && (
                  <div className="mb-6 p-6 bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30 rounded-lg inline-block">
                    <p className="text-dark/60 text-sm uppercase tracking-wider font-lato font-semibold mb-1">
                      Your Estimated Value Range
                    </p>
                    <p className="font-playfair text-3xl font-bold text-dark">
                      ${estimatedLow.toLocaleString()} &ndash; ${estimatedHigh.toLocaleString()}
                    </p>
                  </div>
                )}

                <p className="font-lato text-dark/70 text-lg max-w-md mx-auto mb-8">
                  {REALTOR_NAME} will contact you within 24 hours with a detailed
                  comparative market analysis of your home.
                </p>
                <a
                  href={`tel:${PHONE_NUMBER.replace(/-/g, '')}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-dark font-lato font-bold uppercase tracking-widest rounded hover:shadow-gold-glow transition-all min-h-[52px]"
                >
                  <Phone size={18} />
                  Call {PHONE_NUMBER}
                </a>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 px-4 bg-warm-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold text-sm uppercase tracking-widest font-lato font-bold mb-3">
              Simple Process
            </p>
            <h2 className="font-playfair text-3xl md:text-5xl text-dark font-bold">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20">
                      <Icon className="text-gold" size={32} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-gold text-dark text-sm font-lato font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="font-playfair text-xl md:text-2xl text-dark font-bold mb-3">
                    {step.title}
                  </h3>
                  <p className="font-lato text-dark/60 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Sell With Lorena */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold text-sm uppercase tracking-widest font-lato font-bold mb-3">
              Your Advantage
            </p>
            <h2 className="font-playfair text-3xl md:text-5xl text-dark font-bold">
              Why Sell With {REALTOR_NAME.split(' ')[0]}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUE_PROPS.map(prop => (
              <div
                key={prop.title}
                className="p-8 bg-white border border-gray-200 rounded-lg hover:border-gold/40 hover:shadow-lg transition-all"
              >
                <CheckCircle className="text-gold mb-5" size={28} />
                <h3 className="font-playfair text-xl font-bold text-dark mb-3">
                  {prop.title}
                </h3>
                <p className="font-lato text-dark/60 leading-relaxed">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-dark to-dark-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-playfair text-3xl md:text-4xl text-gold font-bold mb-4">
            Not Ready to Sell Yet?
          </h2>
          <p className="font-lato text-warm-white/70 text-lg mb-8 max-w-xl mx-auto">
            Stay informed about your neighborhood&apos;s market trends.
            Check our latest market report or give us a call — no pressure, just honest advice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/neighborhoods"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-dark font-lato font-bold uppercase tracking-widest rounded hover:shadow-gold-glow transition-all min-h-[52px]"
            >
              View Market Report
              <ArrowRight size={18} />
            </a>
            <a
              href={`tel:${PHONE_NUMBER.replace(/-/g, '')}`}
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gold/40 text-gold font-lato font-bold uppercase tracking-widest rounded hover:bg-gold/10 transition-all min-h-[52px]"
            >
              <Phone size={18} />
              {PHONE_NUMBER}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Sellers;
