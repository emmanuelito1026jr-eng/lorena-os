import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

const heroImages = [
  { src: '/images/hero/el-paso-cityscape.jpg', alt: 'Downtown El Paso skyline with the Franklin Mountains' },
  { src: '/images/hero/el-paso-scenic-drive.jpg', alt: 'Aerial view of the Franklin Mountains and El Paso neighborhoods' },
  { src: '/images/hero/franklin-mountain-sunset.jpg', alt: 'Franklin Mountains silhouette at sunset in El Paso' },
];

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden" aria-label="Hero section">
      {/* Background Images - Carousel */}
      {heroImages.map((image, index) => (
        <div
          key={image.src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: index === currentIndex ? 1 : 0 }}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center sm:px-12 lg:px-16 pt-20">
        <h1 className="animate-fade-in-up font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
          Casas En El Paso, Texas
        </h1>

        <p className="animate-fade-in-up delay-200 max-w-2xl mx-auto text-white/90 font-lato text-lg md:text-xl mb-10 font-light leading-relaxed drop-shadow-md">
          Find your place in the Sun City — bilingual expertise, border-to-border knowledge, and a personal touch that makes all the difference.
        </p>

        <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <a
            href="#contact"
            className="group relative w-full sm:w-auto px-8 py-4 bg-gold text-dark font-lato font-bold uppercase tracking-widest overflow-hidden hover:shadow-gold-glow transition-premium flex items-center justify-center gap-2 rounded"
            aria-label="Get started - contact Lorena"
          >
            <span className="relative z-10">Get Started</span>
            <ArrowRight size={16} aria-hidden="true" className="relative z-10 group-hover:translate-x-1 transition-premium" />
          </a>
          <a
            href="#contact"
            className="group w-full sm:w-auto px-8 py-4 border-2 border-white text-white font-lato font-bold uppercase tracking-widest hover:bg-white hover:text-dark transition-premium relative overflow-hidden rounded"
            aria-label="Contact Lorena Ontiveros-Ortega"
          >
            <span className="relative z-10">Contact Me</span>
          </a>
        </div>

        {/* Stats Row - Horizontal Flex Layout */}
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          {[
            { number: '100+', label: 'Families Served', delay: 'delay-500' },
            { number: '10+', label: 'Years Experience', delay: 'delay-600' },
            { number: '$50M+', label: 'Sales Volume', delay: 'delay-700' }
          ].map((stat) => (
            <div
              key={stat.label}
              className={`animate-fade-in-up ${stat.delay} bg-white/10 backdrop-blur-md rounded-xl p-6 sm:p-8 min-w-[140px] sm:min-w-[180px] text-center hover:-translate-y-1 transition-transform duration-300`}
            >
              <p className="text-4xl font-playfair font-bold text-gold mb-2">{stat.number}</p>
              <p className="text-sm font-lato text-white/90 uppercase tracking-wide">{stat.label}</p>
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
          <ChevronDown className="text-gold group-hover:text-white transition-premium" size={24} />
        </div>
      </a>
    </section>
  );
};

export default Hero;
