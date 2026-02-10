import { PHONE_NUMBER } from '../constants';
import { Phone, MessageCircle, Calendar, ArrowRight } from 'lucide-react';

const CTABanner = () => {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-gold via-gold to-gold/80 text-dark relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Geometric shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-dark/5 rounded-full blur-3xl animate-pulse-gold" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-dark/10 rounded-full blur-3xl animate-pulse-gold" style={{ animationDelay: '1s' }} />

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)`
          }} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 animate-fade-in-up leading-tight">
            Ready to Find Your<br className="hidden sm:block" /> Dream Home?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl font-serif italic mb-2 opacity-90 animate-fade-in-up delay-100">
            ¿Lista Para Encontrar Tu Casa Ideal?
          </p>
          <p className="text-sm sm:text-base max-w-2xl mx-auto opacity-80 animate-fade-in-up delay-200">
            Get personalized service in English or Spanish. Let's start your real estate journey today.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6 mb-10 sm:mb-12 animate-fade-in-up delay-300">
          <a
            href={`tel:${PHONE_NUMBER}`}
            className="group relative flex items-center justify-center gap-3 bg-dark text-ivory px-6 sm:px-8 py-4 text-sm sm:text-base font-bold uppercase tracking-widest hover:bg-dark/90 transition-all duration-300 shadow-2xl overflow-hidden touch-target"
          >
            <Phone size={20} className="group-hover:rotate-12 transition-transform" aria-hidden="true" />
            <span className="relative z-10">{PHONE_NUMBER}</span>

            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer" />
          </a>

          <a
            href="#contact"
            className="group relative flex items-center justify-center gap-3 px-6 sm:px-8 py-4 border-2 border-dark text-dark font-bold uppercase tracking-widest hover:bg-dark hover:text-gold transition-all duration-300 overflow-hidden touch-target text-sm sm:text-base"
          >
            <Calendar size={20} className="group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span>Schedule Consultation</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />

            {/* Slide-in background */}
            <div className="absolute inset-0 bg-dark transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out -z-10" />
          </a>
        </div>

        {/* Quick Contact Options */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-dark/80 text-sm animate-fade-in-up delay-400">
          <div className="flex items-center gap-2">
            <Phone size={16} aria-hidden="true" />
            <span className="font-medium">Call or Text</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-dark/20" />
          <div className="flex items-center gap-2">
            <MessageCircle size={16} aria-hidden="true" />
            <span className="font-medium">Bilingual Service</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-dark/20" />
          <div className="flex items-center gap-2">
            <Calendar size={16} aria-hidden="true" />
            <span className="font-medium">Same-Day Response</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;