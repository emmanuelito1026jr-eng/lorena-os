import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../constants';
import { Home, TrendingUp, Building, ArrowRight } from 'lucide-react';
import { staggerReveal } from '../utils/animations';

// Icon mapping helper
const getIcon = (name: string) => {
  switch (name) {
    case 'Home': return <Home className="w-6 h-6" />;
    case 'TrendingUp': return <TrendingUp className="w-6 h-6" />;
    case 'Building': return <Building className="w-6 h-6" />;
    default: return <Home className="w-6 h-6" />;
  }
};

// Map service titles to URL-friendly IDs
const getServiceId = (subtitle: string): string => {
  return subtitle.toLowerCase();
};

const Services = () => {
  useEffect(() => {
    staggerReveal('.service-card', 0.15);
  }, []);

  return (
    <section id="services" className="py-24 md:py-32 lg:py-40 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
        <div className="text-center mb-16">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-extrabold">Expertise</span>
          <h2 className="mt-3 font-sans text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black font-bold">Comprehensive Real Estate Services</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICES.map((service, index) => {
            const serviceId = getServiceId(service.subtitle);

            return (
              <Link
                key={index}
                to={`/service/${serviceId}`}
                className="service-card group bg-white border border-gray-200 hover:border-gold transition-premium hover:shadow-gold-glow block shadow-premium overflow-hidden"
              >
                {/* Image Section */}
                <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.subtitle}
                    className="w-full h-full object-cover transition-premium group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 bg-gold flex items-center justify-center text-white shadow-lg">
                    {getIcon(service.iconName)}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 sm:p-6 md:p-8">
                  <h3 className="font-sans text-2xl text-black font-bold mb-1">{service.title}</h3>
                  <h4 className="text-gold text-sm uppercase tracking-widest mb-4 font-extrabold">{service.subtitle}</h4>
                  <p className="text-black/70 leading-relaxed mb-6 font-light">
                    {service.description}
                  </p>
                  <span className="text-sm font-bold uppercase tracking-widest text-black group-hover:text-gold transition-premium flex items-center gap-2">
                    Learn More <ArrowRight size={14} className="group-hover:translate-x-1 transition-premium" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
