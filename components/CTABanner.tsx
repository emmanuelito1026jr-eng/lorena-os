import React from 'react';
import { PHONE_NUMBER } from '../constants';
import { Phone } from 'lucide-react';

const CTABanner  = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-gold-dark via-gold to-gold-dark text-dark relative overflow-hidden">
        {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">Ready to Find Your Dream Home?</h2>
        <p className="text-xl md:text-2xl font-serif italic mb-8 opacity-80">¿Lista Para Encontrar Tu Casa Ideal?</p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <a 
            href={`tel:${PHONE_NUMBER}`}
            className="flex items-center gap-3 bg-dark text-ivory px-8 py-4 text-lg font-bold uppercase tracking-widest hover:bg-ivory hover:text-dark transition-all duration-300 shadow-xl"
          >
            <Phone size={20} />
            {PHONE_NUMBER}
          </a>
          <a 
            href="#contact"
            className="px-8 py-4 border-2 border-dark text-dark font-bold uppercase tracking-widest hover:bg-dark hover:text-gold transition-all duration-300"
          >
            Schedule Consultation
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;