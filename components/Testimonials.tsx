import React from 'react';
import { TESTIMONIALS } from '../constants';
import { Star, Quote } from 'lucide-react';

const Testimonials  = () => {
  return (
    <section className="py-24 bg-dark-charcoal relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <Quote size={400} />
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl text-ivory">Client Stories</h2>
          <p className="text-gold italic mt-2 text-lg">Historias de Éxito</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <div key={index} className="bg-dark p-8 border border-white/5 relative group hover:border-gold/30 transition-colors">
              <div className="flex gap-1 text-gold mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-gray-300 italic mb-8 font-light leading-relaxed">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-serif font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-ivory font-bold text-sm uppercase tracking-wide">{testimonial.name}</h4>
                  <p className="text-gray-500 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;