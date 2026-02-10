import React from 'react';
import { NEIGHBORHOODS } from '../constants';

const NeighborhoodGuide  = () => {
  return (
    <section id="neighborhoods" className="py-24 bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <span className="text-gold text-xs uppercase tracking-[0.25em]">Local Expertise</span>
            <h2 className="mt-3 font-serif text-4xl text-ivory">Explore El Paso</h2>
          </div>
          <a href="#all-neighborhoods" className="hidden md:block text-sm text-gray-400 hover:text-gold uppercase tracking-widest transition-colors">
            View All Areas
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {NEIGHBORHOODS.map((hood, index) => (
            <div 
              key={index} 
              className="group relative h-96 overflow-hidden cursor-pointer"
            >
              <img 
                src={hood.image} 
                alt={hood.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 p-6 w-full transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="border-l-2 border-gold pl-4">
                  <h3 className="font-serif text-2xl text-ivory mb-2">{hood.name}</h3>
                  <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 line-clamp-2">
                    {hood.description}
                  </p>
                </div>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                  <span className="text-xs font-bold uppercase tracking-widest text-gold">Explore Area &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <a href="#all-neighborhoods" className="text-sm text-gray-400 hover:text-gold uppercase tracking-widest transition-colors">
            View All Areas
          </a>
        </div>
      </div>
    </section>
  );
};

export default NeighborhoodGuide;