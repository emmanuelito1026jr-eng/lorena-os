import React from 'react';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden" aria-label="Hero section">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {/* PLACEHOLDER: Replace with actual photo of El Paso skyline or Franklin Mountains at sunset */}
        <img
          src="https://placehold.co/1920x1080/1A1A1A/C9A84C?text=El+Paso+Skyline"
          alt="Beautiful El Paso landscape showcasing the city and Franklin Mountains"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-dark"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center sm:px-6 lg:px-8 pt-20">
        <span className="block text-gold text-sm md:text-base uppercase tracking-[0.3em] mb-4 animate-fade-in-up">
          Luxury Real Estate in El Paso
        </span>
        
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-ivory mb-6 leading-tight animate-fade-in-up delay-100">
          Tu Hogar, <br className="md:hidden" />
          <span className="text-gold italic">Tu Futuro</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-gray-300 text-lg md:text-xl mb-10 font-light leading-relaxed animate-fade-in-up delay-200">
          El Paso's Bilingual Real Estate Expert — Helping families on both sides of the border find their place in the world.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-300">
          <a
            href="#contact"
            className="w-full sm:w-auto px-8 py-4 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 flex items-center justify-center gap-2"
            aria-label="Get started - contact Lorena"
          >
            Get Started <ArrowRight size={16} aria-hidden="true" />
          </a>
          <a
            href="#contact"
            className="w-full sm:w-auto px-8 py-4 border border-ivory text-ivory font-bold uppercase tracking-widest hover:bg-ivory hover:text-dark transition-all duration-300"
            aria-label="Contact Lorena Ontiveros-Ortega"
          >
            Contact Me
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-gold to-transparent"></div>
      </div>
    </section>
  );
};

export default Hero;