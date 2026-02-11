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
    <section className="relative h-screen flex items-center justify-center overflow-hidden" aria-label="Hero section">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero/el-paso-skyline.jpg"
          alt="El Paso, Texas skyline"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center sm:px-12 lg:px-16 pt-20">
        <h1 className="hero-title font-playfair text-5xl md:text-7xl font-bold text-gold mb-6 leading-tight">
          Casas En El Paso, Texas
        </h1>

        <p className="hero-description max-w-2xl mx-auto text-warm-white font-lato text-lg md:text-xl mb-10 font-light leading-relaxed">
          Find your place in the Sun City — bilingual expertise, border-to-border knowledge, and a personal touch that makes all the difference.
        </p>

        <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#contact"
            className="group relative w-full sm:w-auto px-8 py-4 bg-gold text-dark font-lato font-bold uppercase tracking-widest overflow-hidden hover:shadow-gold-glow transition-premium flex items-center justify-center gap-2"
            aria-label="Get started - contact Lorena"
          >
            <span className="relative z-10">Get Started</span>
            <ArrowRight size={16} aria-hidden="true" className="relative z-10 group-hover:translate-x-1 transition-premium" />

            {/* Shimmer Effect */}
            <div className="absolute inset-0 shimmer"></div>
          </a>
          <a
            href="#contact"
            className="group w-full sm:w-auto px-8 py-4 border-2 border-gold text-gold font-lato font-bold uppercase tracking-widest hover:bg-gold hover:text-dark transition-premium relative overflow-hidden"
            aria-label="Contact Lorena Ontiveros-Ortega"
          >
            <span className="relative z-10">Contact Me</span>

            {/* Slide-in background */}
            <div className="absolute inset-0 bg-gold transform -translate-x-full group-hover:translate-x-0 transition-premium ease-out"></div>
          </a>
        </div>

        {/* Stats Row */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto items-stretch">
          {[
            { value: '100+', label: 'Families Served' },
            { value: '10+', label: 'Years Experience' },
            { value: '5.0', label: 'Client Rating' },
            { value: '100%', label: 'Bilingual' }
          ].map((stat, index) => (
            <div key={index} className="stat-card bg-dark/80 backdrop-blur-sm border border-gold/30 p-8 md:p-12 hover-lift shadow-premium hover:shadow-gold-glow transition-premium min-h-[180px] flex flex-col items-center justify-center">
              <div className="text-3xl md:text-4xl font-playfair font-black text-gold mb-1 text-center">{stat.value}</div>
              <div className="text-xs md:text-sm text-warm-white/80 uppercase tracking-wider font-lato font-medium text-center">{stat.label}</div>
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
          <ChevronDown className="text-gold group-hover:text-warm-white transition-premium" size={24} />
        </div>
      </a>
    </section>
  );
};

export default Hero;
