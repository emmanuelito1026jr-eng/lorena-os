import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CTABanner from '../components/CTABanner';
import { PHONE_NUMBER } from '../constants';
import { Shield, Phone, Home, DollarSign, MapPin, Clock, ChevronRight, Star, Award, Users, Truck, CheckCircle } from 'lucide-react';

// BAH rates for Fort Bliss (El Paso) 2026 — with and without dependents
const BAH_RATES: Record<string, { with: number; without: number }> = {
  'E-1': { with: 1206, without: 1017 },
  'E-2': { with: 1206, without: 1017 },
  'E-3': { with: 1206, without: 1017 },
  'E-4': { with: 1302, without: 1098 },
  'E-5': { with: 1413, without: 1194 },
  'E-6': { with: 1530, without: 1290 },
  'E-7': { with: 1632, without: 1389 },
  'E-8': { with: 1728, without: 1470 },
  'E-9': { with: 1824, without: 1560 },
  'W-1': { with: 1530, without: 1290 },
  'W-2': { with: 1632, without: 1389 },
  'W-3': { with: 1728, without: 1470 },
  'W-4': { with: 1824, without: 1560 },
  'W-5': { with: 1920, without: 1650 },
  'O-1': { with: 1413, without: 1194 },
  'O-1E': { with: 1530, without: 1290 },
  'O-2': { with: 1530, without: 1290 },
  'O-2E': { with: 1632, without: 1389 },
  'O-3': { with: 1728, without: 1470 },
  'O-3E': { with: 1824, without: 1560 },
  'O-4': { with: 1920, without: 1650 },
  'O-5': { with: 2016, without: 1740 },
  'O-6': { with: 2112, without: 1830 },
  'O-7': { with: 2208, without: 1920 },
};

const FORT_BLISS_NEIGHBORHOODS = [
  {
    name: 'Northeast El Paso',
    commute: '10-15 min',
    priceRange: '$180K - $350K',
    description: 'Most popular with military families. Close to post, great schools, newer construction.',
    highlights: ['Pebble Hills', 'Tierra Este', 'Montwood'],
  },
  {
    name: 'Horizon City',
    commute: '15-25 min',
    priceRange: '$160K - $280K',
    description: 'Affordable new builds with larger lots. Growing community east of Fort Bliss.',
    highlights: ['Eastlake', 'Horizon Heights', 'Desert Sands'],
  },
  {
    name: 'East El Paso',
    commute: '10-20 min',
    priceRange: '$150K - $300K',
    description: 'Established neighborhoods with easy access to Sgt. Major Blvd gate.',
    highlights: ['Montwood', 'Pebble Hills', 'Vista del Sol'],
  },
  {
    name: 'Westside El Paso',
    commute: '20-30 min',
    priceRange: '$200K - $450K',
    description: 'Upscale area near UTEP and downtown. Best dining and entertainment options.',
    highlights: ['Kern Place', 'Coronado Hills', 'Mesa Hills'],
  },
];

const MILITARY_TESTIMONIALS = [
  {
    name: 'Sgt. Marcus & Jennifer R.',
    text: 'PCS\'d from Fort Hood and Lorena made our move seamless. She knew exactly which neighborhoods were best for military families and handled everything while we were still in Texas. Closed 2 weeks after arriving!',
    branch: 'U.S. Army',
    rating: 5,
  },
  {
    name: 'SSgt. David & Maria L.',
    text: 'As a first-time buyer using a VA loan, I was nervous about the process. Lorena walked us through every step in both English and Spanish. My wife felt so comfortable working with her. We love our new home!',
    branch: 'U.S. Army',
    rating: 5,
  },
  {
    name: 'CPT. Sarah T.',
    text: 'Third PCS, first time buying instead of renting. Lorena\'s BAH calculator helped us understand exactly what we could afford. She found us a home under budget with a pool! Best decision we made.',
    branch: 'U.S. Army',
    rating: 5,
  },
];

const VA_LOAN_BENEFITS = [
  { title: 'Zero Down Payment', description: 'Buy a home with $0 down — your service earns this benefit.' },
  { title: 'No PMI Required', description: 'Save $100-$300/month compared to conventional loans.' },
  { title: 'Lower Interest Rates', description: 'VA loans typically offer 0.25-0.5% lower rates.' },
  { title: 'Flexible Credit Requirements', description: 'More forgiving credit guidelines than conventional loans.' },
  { title: 'Limited Closing Costs', description: 'VA limits what you can be charged at closing.' },
  { title: 'No Prepayment Penalty', description: 'Pay off your loan early without any fees.' },
];

const PCS_TIMELINE = [
  { step: '6+ Months Out', title: 'Get Pre-Approved', description: 'Connect with Lorena and a VA-experienced lender to know your budget before house hunting.' },
  { step: '4-6 Months Out', title: 'Virtual Home Search', description: 'Lorena sends you listings via video tours. Narrow down neighborhoods based on your commute, schools, and lifestyle.' },
  { step: '2-4 Months Out', title: 'Make an Offer', description: 'Found your home? Lorena negotiates and manages the contract while you focus on your PCS.' },
  { step: '1-2 Months Out', title: 'Inspections & Appraisal', description: 'VA appraisal and home inspection happen. Lorena coordinates everything — you just sign.' },
  { step: 'Arrival Week', title: 'Close & Move In', description: 'Keys in hand on day one. Lorena has everything ready so you can focus on in-processing.' },
];

export default function MilitaryPage() {
  usePageMeta({
    title: 'Military & Fort Bliss VA Home Loans',
    description: 'VA home loan specialist near Fort Bliss. BAH calculator, PCS relocation guide, and military-friendly neighborhoods in El Paso. Hablamos espanol.',
    canonicalUrl: 'https://casasenelpasotx.com/about/military',
    jsonLd: {
      '@type': 'Service',
      name: 'Military & VA Home Buying Services',
      provider: { '@type': 'Person', name: 'Lorena Ontiveros-Ortega' },
      areaServed: 'El Paso, TX',
      description: 'Specialized real estate services for military families stationed at Fort Bliss.',
    },
  });
  const [selectedRank, setSelectedRank] = useState('E-5');
  const [hasDependents, setHasDependents] = useState(true);
  const bahRate = BAH_RATES[selectedRank];
  const monthlyBah = bahRate ? (hasDependents ? bahRate.with : bahRate.without) : 0;
  // Estimate: mortgage ≈ BAH rate, home price ≈ BAH * 200 (rough rule of thumb)
  const estimatedHomePrice = monthlyBah * 200;

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative bg-dark pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-dark-100 opacity-95" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/images/hero/el-paso-cityscape.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-gold" size={28} />
              <span className="text-gold font-lato text-sm uppercase tracking-widest font-bold">Fort Bliss Military Specialist</span>
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight max-w-3xl">
              Welcome to El Paso,<br className="hidden md:block" /> Service Member
            </h1>
            <p className="font-lato text-lg md:text-xl text-white/70 max-w-2xl mb-8 leading-relaxed">
              PCS'ing to Fort Bliss? Lorena has helped hundreds of military families find their perfect home in El Paso — with VA loan expertise, bilingual service, and knowledge of every neighborhood near post.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`tel:${PHONE_NUMBER}`}
                className="inline-flex items-center justify-center gap-2 bg-gold text-white px-8 py-4 font-lato font-bold text-sm uppercase tracking-wider hover:bg-gold-dark transition-all rounded-lg"
              >
                <Phone size={18} />
                Call Lorena: {PHONE_NUMBER}
              </a>
              <Link
                to="/properties"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white px-8 py-4 font-lato font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all rounded-lg"
              >
                <Home size={18} />
                Browse Homes Near Fort Bliss
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="bg-gold/10 border-y border-gold/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Shield, label: 'VA Loan Expert', value: '100+ Military Families' },
                { icon: Award, label: 'Bilingual Service', value: 'English & Spanish' },
                { icon: Star, label: 'Google Rating', value: '5.0 Stars' },
                { icon: Users, label: 'PCS Relocations', value: 'Seamless Process' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <stat.icon className="text-gold mb-1" size={22} />
                  <p className="font-playfair font-bold text-dark text-sm md:text-base">{stat.value}</p>
                  <p className="font-lato text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VA Loan Benefits */}
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="text-center mb-16">
              <p className="text-gold font-lato text-sm uppercase tracking-widest font-bold mb-3">Your Earned Benefit</p>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark mb-4">VA Loan Advantages</h2>
              <p className="font-lato text-gray-600 max-w-2xl mx-auto">
                As an active duty service member, veteran, or eligible spouse, the VA loan is one of the most powerful home buying tools available. Here's why:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {VA_LOAN_BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="text-gold" size={20} />
                  </div>
                  <h3 className="font-playfair text-lg font-bold text-dark mb-2">{benefit.title}</h3>
                  <p className="font-lato text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BAH Calculator */}
        <section className="py-20 md:py-28 bg-warm-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-gold font-lato text-sm uppercase tracking-widest font-bold mb-3">Plan Your Budget</p>
                <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark mb-4">Fort Bliss BAH Calculator</h2>
                <p className="font-lato text-gray-600 mb-8 leading-relaxed">
                  Your Basic Allowance for Housing (BAH) can cover your entire mortgage payment — or most of it. Select your pay grade to see your estimated BAH and what home price range that supports.
                </p>

                {/* Calculator Form */}
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-premium">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="rank" className="block text-xs uppercase tracking-widest text-dark/60 mb-2 font-lato font-semibold">
                        Pay Grade / Rank
                      </label>
                      <select
                        id="rank"
                        value={selectedRank}
                        onChange={(e) => setSelectedRank(e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 text-dark px-4 py-4 font-lato focus:outline-none focus:border-gold transition-all rounded-lg appearance-none cursor-pointer"
                      >
                        <optgroup label="Enlisted">
                          {['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9'].map((rank) => (
                            <option key={rank} value={rank}>{rank}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Warrant Officer">
                          {['W-1', 'W-2', 'W-3', 'W-4', 'W-5'].map((rank) => (
                            <option key={rank} value={rank}>{rank}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Officer">
                          {['O-1', 'O-1E', 'O-2', 'O-2E', 'O-3', 'O-3E', 'O-4', 'O-5', 'O-6', 'O-7'].map((rank) => (
                            <option key={rank} value={rank}>{rank}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-dark/60 mb-3 font-lato font-semibold">
                        Dependents
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setHasDependents(true)}
                          className={`flex-1 py-3 px-4 rounded-lg font-lato font-semibold text-sm uppercase tracking-wider transition-all ${
                            hasDependents
                              ? 'bg-gold text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          With Dependents
                        </button>
                        <button
                          type="button"
                          onClick={() => setHasDependents(false)}
                          className={`flex-1 py-3 px-4 rounded-lg font-lato font-semibold text-sm uppercase tracking-wider transition-all ${
                            !hasDependents
                              ? 'bg-gold text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Without
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="lg:pt-16">
                <div className="bg-dark rounded-xl p-8 md:p-10 text-white">
                  <p className="text-white/60 font-lato text-xs uppercase tracking-widest mb-2">Your Monthly BAH</p>
                  <p className="font-playfair text-5xl md:text-6xl font-bold text-gold mb-1">
                    ${monthlyBah.toLocaleString()}
                  </p>
                  <p className="font-lato text-white/50 text-sm mb-8">
                    Fort Bliss, TX ({selectedRank}, {hasDependents ? 'with' : 'without'} dependents)
                  </p>

                  <div className="border-t border-white/10 pt-8 space-y-6">
                    <div>
                      <p className="text-white/60 font-lato text-xs uppercase tracking-widest mb-1">Estimated Home Price Range</p>
                      <p className="font-playfair text-2xl font-bold text-white">
                        ${(estimatedHomePrice * 0.85).toLocaleString(undefined, { maximumFractionDigits: 0 })} — ${(estimatedHomePrice * 1.15).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 font-lato text-xs uppercase tracking-widest mb-1">Annual BAH Total</p>
                      <p className="font-playfair text-2xl font-bold text-white">
                        ${(monthlyBah * 12).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-white/40 text-xs font-lato">
                      *Estimates based on 2026 BAH rates for Fort Bliss (ZIP 79916). Actual home affordability depends on interest rates, taxes, insurance, and other debts. Contact Lorena for a personalized analysis.
                    </p>
                  </div>

                  <a
                    href={`tel:${PHONE_NUMBER}`}
                    className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-gold text-white py-4 font-lato font-bold text-sm uppercase tracking-wider hover:bg-gold-dark transition-all rounded-lg"
                  >
                    <Phone size={18} />
                    Get Your Personalized Plan
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PCS Timeline */}
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="text-center mb-16">
              <p className="text-gold font-lato text-sm uppercase tracking-widest font-bold mb-3">Your PCS Playbook</p>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark mb-4">PCS Relocation Timeline</h2>
              <p className="font-lato text-gray-600 max-w-2xl mx-auto">
                Whether you're 6 months out or arriving next week, Lorena has a plan to get you into your new home. Here's how a typical military PCS home purchase works:
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-0">
              {PCS_TIMELINE.map((item, index) => (
                <div key={item.step} className="relative flex gap-6">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center text-white font-playfair font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    {index < PCS_TIMELINE.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gold/20 my-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-10">
                    <span className="inline-block bg-gold/10 text-gold font-lato text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
                      {item.step}
                    </span>
                    <h3 className="font-playfair text-xl font-bold text-dark mb-2">{item.title}</h3>
                    <p className="font-lato text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Neighborhoods Near Fort Bliss */}
        <section className="py-20 md:py-28 bg-warm-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="text-center mb-16">
              <p className="text-gold font-lato text-sm uppercase tracking-widest font-bold mb-3">Where Military Families Live</p>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark mb-4">Neighborhoods Near Fort Bliss</h2>
              <p className="font-lato text-gray-600 max-w-2xl mx-auto">
                Each area has its own personality. Lorena knows the commute times, school ratings, and which neighborhoods work best for military families.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FORT_BLISS_NEIGHBORHOODS.map((hood) => (
                <div
                  key={hood.name}
                  className="bg-white rounded-xl p-6 md:p-8 border border-gray-100 hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-playfair text-xl font-bold text-dark">{hood.name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-sm font-lato text-gray-500">
                          <Clock size={14} className="text-gold" />
                          {hood.commute} to post
                        </span>
                        <span className="flex items-center gap-1 text-sm font-lato text-gray-500">
                          <DollarSign size={14} className="text-gold" />
                          {hood.priceRange}
                        </span>
                      </div>
                    </div>
                    <MapPin className="text-gold shrink-0" size={24} />
                  </div>
                  <p className="font-lato text-gray-600 text-sm mb-4 leading-relaxed">{hood.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {hood.highlights.map((h) => (
                      <span key={h} className="bg-gold/10 text-gold font-lato text-xs font-semibold px-3 py-1 rounded-full">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                to="/neighborhoods"
                className="inline-flex items-center gap-2 text-gold font-lato font-bold text-sm uppercase tracking-wider hover:text-gold-dark transition-all"
              >
                View All Neighborhoods
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Military Testimonials */}
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="text-center mb-16">
              <p className="text-gold font-lato text-sm uppercase tracking-widest font-bold mb-3">From Fellow Service Members</p>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark mb-4">Military Family Reviews</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MILITARY_TESTIMONIALS.map((testimonial, _i) => (
                <div
                  key={testimonial.name}
                  className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 hover:shadow-premium transition-all duration-300"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} className="text-gold fill-gold" size={16} />
                    ))}
                  </div>
                  <p className="font-lato text-gray-600 text-sm leading-relaxed mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-playfair font-bold text-dark text-sm">{testimonial.name}</p>
                    <p className="font-lato text-xs text-gray-500">{testimonial.branch}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Lorena for Military */}
        <section className="py-20 md:py-28 bg-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="text-center mb-16">
              <p className="text-gold font-lato text-sm uppercase tracking-widest font-bold mb-3">Why Military Families Choose Lorena</p>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4">Your Fort Bliss Expert</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: 'VA Loan Specialist',
                  description: 'Deep experience with VA loans, COE requirements, and VA appraisal expectations. No learning curve — Lorena knows the process inside and out.',
                },
                {
                  icon: Truck,
                  title: 'Remote PCS Buying',
                  description: 'Can\'t visit El Paso before your move? Lorena does video walkthroughs, handles everything remotely, and has keys ready when you arrive.',
                },
                {
                  icon: Users,
                  title: 'Bilingual Service',
                  description: 'Lorena speaks fluent English and Spanish — perfect for families who want to communicate in their preferred language.',
                },
                {
                  icon: Clock,
                  title: 'Fast Closings',
                  description: 'Military timelines are tight. Lorena\'s lender network understands PCS deadlines and can close in as little as 21 days.',
                },
                {
                  icon: MapPin,
                  title: 'Local Knowledge',
                  description: '10+ years in El Paso. Knows every neighborhood, school district, commute route, and hidden gem near Fort Bliss.',
                },
                {
                  icon: DollarSign,
                  title: 'BAH Optimization',
                  description: 'Helps you find homes that align with your BAH rate so your housing allowance covers the mortgage — build equity, not rent receipts.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                  <item.icon className="text-gold mb-4" size={24} />
                  <h3 className="font-playfair text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="font-lato text-white/60 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
