import React from 'react';
import { STATS } from '../constants';
import { ArrowRight } from 'lucide-react';

const AboutPreview  = () => {
  return (
    <section id="about" className="py-20 md:py-32 bg-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Image Side */}
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-full h-full border border-gold/30 z-0"></div>
            <div className="relative z-10 aspect-[4/5] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
              {/* PLACEHOLDER: Replace with professional headshot of Lorena Ontiveros-Ortega */}
              <img
                src="https://placehold.co/800x1000/1A1A1A/C9A84C?text=Lorena+Ontiveros"
                alt="Lorena Ontiveros-Ortega, professional real estate agent"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative Label */}
            <div className="absolute -bottom-6 -right-6 bg-gold text-dark px-8 py-4 z-20">
              <span className="font-serif font-bold text-xl block">Lorena Ontiveros</span>
              <span className="text-xs uppercase tracking-widest block">Realtor® & Financial Expert</span>
            </div>
          </div>

          {/* Text Side */}
          <div className="space-y-8">
            <div>
              <h2 className="text-gold text-sm uppercase tracking-[0.2em] mb-2">Meet Your Agent</h2>
              <h3 className="font-serif text-4xl md:text-5xl text-ivory mb-6">Bridging Cultures,<br/>Building Wealth</h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                I don't just find you a home; I make sure you can afford it. With over 10 years of banking experience and a BBA in Marketing from UTEP, I bring a financial strategist's mindset to every transaction.
              </p>
              <p className="text-gray-400 leading-relaxed text-lg mt-4">
                Growing up in both El Paso and Cd. Juárez, I understand the unique pulse of our border community. Whether you prefer English or Spanish, I treat you like family.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
              {STATS.map((stat, index) => (
                <div key={index}>
                  <p className="text-3xl font-serif text-gold mb-1">{stat.value}</p>
                  <p className="text-xs uppercase tracking-wider text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="pt-4">
               <a href="#contact" className="inline-flex items-center gap-2 text-ivory border-b border-gold pb-1 hover:text-gold transition-colors">
                  Read Full Bio <ArrowRight size={16} />
               </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutPreview;