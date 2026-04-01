import { useState, useEffect } from 'react';
import { MapPin, Languages, Sparkles, Star } from 'lucide-react';
import { TESTIMONIALS } from '../constants';
import { useTranslation } from '../lib/i18n';

type ValuePropKey = 'localExpert' | 'bilingualService' | 'aiSearch';

const VALUE_PROPS: { icon: typeof MapPin; titleKey: ValuePropKey; descKey: ValuePropKey }[] = [
  {
    icon: MapPin,
    titleKey: 'localExpert',
    descKey: 'localExpert',
  },
  {
    icon: Languages,
    titleKey: 'bilingualService',
    descKey: 'bilingualService',
  },
  {
    icon: Sparkles,
    titleKey: 'aiSearch',
    descKey: 'aiSearch',
  },
];

const WhyLorena = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonial = TESTIMONIALS[currentTestimonial];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-lato font-semibold">{t('why.subtitle')}</span>
          <h2 className="mt-2 font-playfair text-3xl md:text-4xl font-bold text-dark">{t('why.headline')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {VALUE_PROPS.map((prop) => (
            <div
              key={prop.titleKey}
              className="text-center p-8 rounded-xl border border-gray-100 hover:border-gold/30 hover:shadow-md transition-all duration-300"
            >
              <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <prop.icon className="text-gold" size={24} />
              </div>
              <h3 className="font-playfair text-xl font-bold text-dark mb-3">{t(`why.${prop.titleKey}`)}</h3>
              <p className="font-lato text-gray-600 leading-relaxed">{t(`why.${prop.descKey}Desc`)}</p>
            </div>
          ))}
        </div>

        {/* Rotating Testimonial */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} className="text-gold fill-gold" />
            ))}
          </div>
          <blockquote className="font-lato text-lg md:text-xl text-gray-700 italic leading-relaxed mb-4 min-h-[80px] transition-all duration-500">
            &ldquo;{testimonial.text}&rdquo;
          </blockquote>
          <p className="font-lato font-semibold text-dark">{testimonial.name}</p>
          <p className="font-lato text-sm text-gold">{testimonial.role}</p>

          {/* Dots */}
          <div className="flex justify-center gap-3 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentTestimonial(i)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={`Show testimonial ${i + 1}`}
              >
                <span className={`block w-2 h-2 rounded-full transition-all ${
                  i === currentTestimonial ? 'bg-gold w-6' : 'bg-gray-300'
                }`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyLorena;
