import React from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../constants';
import { Home, TrendingUp, Building } from 'lucide-react';

// Icon mapping helper
const getIcon = (name: string) => {
  switch (name) {
    case 'Home': return <Home className="w-8 h-8 text-gold" />;
    case 'TrendingUp': return <TrendingUp className="w-8 h-8 text-gold" />;
    case 'Building': return <Building className="w-8 h-8 text-gold" />;
    default: return <Home className="w-8 h-8 text-gold" />;
  }
};

// Map service titles to URL-friendly IDs
const getServiceId = (subtitle: string): string => {
  return subtitle.toLowerCase(); // "Buyers", "Sellers", "Investments" -> "buyers", "sellers", "investments"
};

const Services  = () => {
  return (
    <section id="services" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-bold">Expertise</span>
          <h2 className="mt-3 font-serif text-4xl text-gray-900">Comprehensive Real Estate Services</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICES.map((service, index) => {
            const serviceId = getServiceId(service.subtitle);
            return (
              <Link
                key={index}
                to={`/service/${serviceId}`}
                className="group p-8 md:p-10 bg-white border border-gray-200 hover:border-gold/50 transition-all duration-500 hover:-translate-y-2 block shadow-md hover:shadow-xl rounded-lg"
              >
                <div className="mb-6 p-4 bg-gray-50 inline-block rounded-full group-hover:bg-gold/10 transition-colors">
                  {getIcon(service.iconName)}
                </div>
                <h3 className="font-serif text-2xl text-gray-900 mb-1">{service.title}</h3>
                <h4 className="text-gold text-sm uppercase tracking-widest mb-4 font-bold">{service.subtitle}</h4>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {service.description}
                </p>
                <span className="text-sm font-bold uppercase tracking-widest text-gray-900 group-hover:text-gold transition-colors flex items-center gap-2">
                  Learn More <span className="text-xl leading-none">&rarr;</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;