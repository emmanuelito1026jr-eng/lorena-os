import { PHONE_NUMBER } from '../constants';
import { Phone, MessageCircle, Calendar, ArrowRight } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

const CTABanner = () => {
  const { t } = useTranslation();
  return (
    <section className="relative py-20 sm:py-24 md:py-32 text-white overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero/franklin-mountain-sunset.jpg"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          aria-hidden="true"
          width={1920}
          height={1080}
        />
        {/* Gold overlay for brand consistency */}
        <div className="absolute inset-0 bg-gold/85"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight">
            {t('cta.headline')}
          </h2>
          <p className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2">
            {t('cta.headlineEs')}
          </p>
          <p className="text-sm sm:text-base max-w-2xl mx-auto opacity-90 font-light">
            {t('cta.description')}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
          <a
            href={`tel:${PHONE_NUMBER}`}
            className="group relative flex items-center justify-center gap-3 bg-black text-white px-6 sm:px-8 py-4 text-sm sm:text-base font-bold uppercase tracking-widest hover:bg-black/90 transition-premium shadow-premium overflow-hidden touch-target"
          >
            <Phone size={20} className="group-hover:rotate-12 transition-premium" aria-hidden="true" />
            <span className="relative z-10">{PHONE_NUMBER}</span>

            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer" />
          </a>

          <a
            href="#contact"
            className="group relative flex items-center justify-center gap-3 px-6 sm:px-8 py-4 border-2 border-white text-white font-bold uppercase tracking-widest hover:bg-white hover:text-gold transition-premium overflow-hidden touch-target text-sm sm:text-base"
          >
            <Calendar size={20} className="group-hover:scale-110 transition-premium" aria-hidden="true" />
            <span>{t('cta.scheduleConsultation')}</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-premium" aria-hidden="true" />
          </a>
        </div>

        {/* Quick Contact Options */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-white/90 text-sm">
          <div className="flex items-center gap-2">
            <Phone size={16} aria-hidden="true" />
            <span className="font-semibold">{t('cta.callOrText')}</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/30" />
          <div className="flex items-center gap-2">
            <MessageCircle size={16} aria-hidden="true" />
            <span className="font-semibold">{t('cta.bilingualService')}</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/30" />
          <div className="flex items-center gap-2">
            <Calendar size={16} aria-hidden="true" />
            <span className="font-semibold">{t('cta.sameDayResponse')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
