import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Pause, Play, Phone } from 'lucide-react';
import { PHONE_NUMBER } from '../constants';
import { useMarketSnapshot } from '../hooks/useMarketSnapshots';
import { useTranslation } from '../lib/i18n';

const heroImages = [
  { src: '/images/hero/el-paso-cityscape.jpg', alt: 'Downtown El Paso skyline with the Franklin Mountains' },
  { src: '/images/hero/el-paso-scenic-drive.jpg', alt: 'Aerial view of the Franklin Mountains and El Paso neighborhoods' },
  { src: '/images/hero/franklin-mountain-sunset.jpg', alt: 'Franklin Mountains silhouette at sunset in El Paso' },
];

// Animated counter that triggers on scroll into view
function AnimatedCounter({ end, prefix = '', suffix = '' }: { end: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const duration = 1800;
        const start = Date.now();
        const animate = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(end * eased));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [beds, setBeds] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Pull live market stats from Supabase (falls back to mock)
  const { data: snapshotData } = useMarketSnapshot('El Paso', 'city');
  const liveStats = (() => {
    const snapshot = snapshotData?.current;
    if (snapshot && snapshot.median_price) {
      return {
        activeListings: snapshot.active_count || 0,
        medianPriceK: Math.round(Number(snapshot.median_price) / 1000),
        avgDom: snapshot.avg_dom ?? 0,
      };
    }
    // El Paso market defaults while real data loads
    return { activeListings: 0, medianPriceK: 230, avgDom: 45 };
  })();

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, isAutoPlaying]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (beds) params.set('beds', beds);
    if (priceMax) params.set('maxPrice', priceMax);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden" aria-label="Hero section" aria-roledescription="carousel">
      {/* Background Images */}
      {heroImages.map((image, index) => (
        <div
          key={image.src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: index === currentIndex ? 1 : 0 }}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${index + 1} of ${heroImages.length}`}
          aria-hidden={index !== currentIndex}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
            fetchPriority={index === 0 ? 'high' : undefined}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/50" />

      {/* Carousel Control */}
      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="absolute top-24 right-6 z-20 w-10 h-10 bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-black/50 transition-premium flex items-center justify-center rounded-full touch-target"
        aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
      >
        {isAutoPlaying ? <Pause className="text-white/80" size={16} /> : <Play className="text-white/80" size={16} />}
      </button>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center sm:px-6 md:px-12 pt-20">
        <h1 className="animate-fade-in-up font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
          {t('hero.headline')}
        </h1>

        <p className="animate-fade-in-up delay-200 max-w-2xl mx-auto text-white/80 font-lato text-lg md:text-xl mb-10 font-light leading-relaxed drop-shadow-md">
          {t('hero.subheadline')}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="animate-fade-in-up delay-300 max-w-3xl mx-auto mb-8">
          <div className="bg-white rounded-xl md:rounded-full p-2 shadow-premium-lg flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 px-4">
              <Search size={20} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder={t('hero.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 font-lato text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:rounded-lg bg-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="px-4 py-3 font-lato text-sm text-gray-600 bg-gray-50 rounded-lg md:rounded-full border-0 focus:ring-2 focus:ring-gold/50 appearance-none cursor-pointer"
              >
                <option value="">{t('hero.beds')}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
              <select
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="px-4 py-3 font-lato text-sm text-gray-600 bg-gray-50 rounded-lg md:rounded-full border-0 focus:ring-2 focus:ring-gold/50 appearance-none cursor-pointer"
              >
                <option value="">{t('hero.price')}</option>
                <option value="200000">Under $200K</option>
                <option value="300000">Under $300K</option>
                <option value="400000">Under $400K</option>
                <option value="500000">Under $500K</option>
                <option value="750000">Under $750K</option>
                <option value="1000000">Under $1M</option>
              </select>
              <button
                type="submit"
                aria-label="Search homes"
                className="bg-gold text-white px-6 py-3 rounded-lg md:rounded-full font-lato font-bold text-sm uppercase tracking-wider hover:bg-gold-dark transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Search size={16} />
                <span className="hidden sm:inline">{t('hero.search')}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Call CTA */}
        <div className="animate-fade-in-up delay-400 mb-12">
          <a
            href={`tel:${PHONE_NUMBER}`}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white font-lato text-sm transition-all"
          >
            <Phone size={14} />
            {t('hero.callLorena')} {PHONE_NUMBER}
          </a>
        </div>

        {/* Live Market Stats */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          <div className="animate-fade-in-up delay-500 bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 min-w-[90px] md:min-w-[140px] text-center hover:-translate-y-1 transition-transform duration-300">
            <p className="text-2xl md:text-3xl font-playfair font-bold text-gold mb-1 tabular-nums">
              <AnimatedCounter end={liveStats.activeListings} />
            </p>
            <p className="text-xs font-lato text-white/80 uppercase tracking-wide">{t('hero.activeListings')}</p>
          </div>
          <div className="animate-fade-in-up delay-600 bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 min-w-[90px] md:min-w-[140px] text-center hover:-translate-y-1 transition-transform duration-300">
            <p className="text-2xl md:text-3xl font-playfair font-bold text-gold mb-1 tabular-nums">
              <AnimatedCounter end={liveStats.medianPriceK} prefix="$" suffix="K" />
            </p>
            <p className="text-xs font-lato text-white/80 uppercase tracking-wide">{t('hero.medianPrice')}</p>
          </div>
          <div className="animate-fade-in-up delay-700 bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 min-w-[90px] md:min-w-[140px] text-center hover:-translate-y-1 transition-transform duration-300">
            <p className="text-2xl md:text-3xl font-playfair font-bold text-gold mb-1 tabular-nums">
              <AnimatedCounter end={liveStats.avgDom} suffix=" days" />
            </p>
            <p className="text-xs font-lato text-white/80 uppercase tracking-wide">{t('hero.avgDays')}</p>
          </div>
          <div className="animate-fade-in-up delay-800 bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 min-w-[90px] md:min-w-[140px] text-center hover:-translate-y-1 transition-transform duration-300">
            <p className="text-2xl md:text-3xl font-playfair font-bold text-gold mb-1">5.0</p>
            <p className="text-xs font-lato text-white/80 uppercase tracking-wide">{t('hero.googleRating')}</p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <a
        href="#featured"
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer group"
        aria-label="Scroll to featured listings"
      >
        <ChevronDown className="text-gold group-hover:text-white transition-premium" size={28} />
      </a>
    </section>
  );
};

export default Hero;
