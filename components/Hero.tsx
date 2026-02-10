import { useEffect } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { gsap } from '../utils/gsap-config';
import { staggerReveal } from '../utils/animations';

const Hero = () => {
  useEffect(() => {
    // Hero title animation
    gsap.from('.hero-title', {
      y: 80,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out'
    });

    // Subtitle animation
    gsap.from('.hero-subtitle', {
      y: 60,
      opacity: 0,
      duration: 1,
      delay: 0.3,
      ease: 'power3.out'
    });

    // Description animation
    gsap.from('.hero-description', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      delay: 0.5,
      ease: 'power3.out'
    });

    // CTA buttons animation
    gsap.from('.hero-cta', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.7,
      ease: 'power3.out'
    });

    // Stats cards staggered reveal
    staggerReveal('.stat-card', 0.15);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-white" aria-label="Hero section">
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center sm:px-12 lg:px-16 pt-20">
        <span className="hero-subtitle block text-gold text-sm md:text-base uppercase tracking-[0.3em] mb-4 font-extrabold">
          Luxury Real Estate in El Paso
        </span>

        <h1 className="hero-title font-sans text-6xl md:text-8xl lg:text-9xl font-black text-black mb-6 leading-tight">
          Tu Hogar, <br className="md:hidden" />
          <span className="gradient-text">Tu Futuro</span>
        </h1>

        <p className="hero-description max-w-2xl mx-auto text-black/80 text-lg md:text-xl mb-10 font-light leading-relaxed">
          El Paso's Bilingual Real Estate Expert — Helping families on both sides of the border find their place in the world.
        </p>

        <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#contact"
            className="group relative w-full sm:w-auto px-8 py-4 bg-gold text-white font-bold uppercase tracking-widest overflow-hidden hover:shadow-gold-glow transition-premium flex items-center justify-center gap-2"
            aria-label="Get started - contact Lorena"
          >
            <span className="relative z-10">Get Started</span>
            <ArrowRight size={16} aria-hidden="true" className="relative z-10 group-hover:translate-x-1 transition-premium" />

            {/* Shimmer Effect */}
            <div className="absolute inset-0 shimmer"></div>
          </a>
          <a
            href="#contact"
            className="group w-full sm:w-auto px-8 py-4 border-2 border-black text-black font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-premium relative overflow-hidden"
            aria-label="Contact Lorena Ontiveros-Ortega"
          >
            <span className="relative z-10">Contact Me</span>

            {/* Slide-in background */}
            <div className="absolute inset-0 bg-black transform -translate-x-full group-hover:translate-x-0 transition-premium ease-out"></div>
          </a>
        </div>

        {/* Stats Row */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { value: '100+', label: 'Families Served' },
            { value: '10+', label: 'Years Experience' },
            { value: '5.0', label: 'Client Rating' },
            { value: '100%', label: 'Bilingual' }
          ].map((stat, index) => (
            <div key={index} className="stat-card bg-white border border-gray-200 p-8 md:p-12 hover-lift shadow-premium hover:shadow-gold-glow transition-premium">
              <div className="text-3xl md:text-4xl font-sans font-black text-gold mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-black/60 uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <a
        href="#about"
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer group"
        aria-label="Scroll to about section"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-gold to-transparent"></div>
          <ChevronDown className="text-gold group-hover:text-black transition-premium" size={24} />
        </div>
      </a>
    </section>
  );
};

export default Hero;
