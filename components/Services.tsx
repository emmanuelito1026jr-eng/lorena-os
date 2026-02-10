import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../constants';
import { Home, TrendingUp, Building } from 'lucide-react';
import { staggerReveal } from '../utils/animations';

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

// Angular clip-path patterns
const clipPaths = [
  'clip-angle-1',
  'clip-angle-2',
  'clip-angle-3'
];

const Services = () => {
  useEffect(() => {
    staggerReveal('.service-card', 0.15);
  }, []);

  return (
    <section id="services" className="py-24 md:py-32 lg:py-40 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
        <div className="text-center mb-16">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-extrabold">Expertise</span>
          <h2 className="mt-3 font-sans text-5xl md:text-6xl text-black font-bold">Comprehensive Real Estate Services</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICES.map((service, index) => {
            const serviceId = getServiceId(service.subtitle);
            const clipPathClass = clipPaths[index % clipPaths.length];

            return (
              <Link
                key={index}
                to={`/service/${serviceId}`}
                className={`service-card group p-8 md:p-12 bg-white border border-gray-200 hover:border-gold transition-premium hover:shadow-gold-glow block shadow-premium ${clipPathClass}`}
              >
                <div className="mb-6 p-4 bg-gold/5 inline-block group-hover:bg-gold/10 transition-premium">
                  {getIcon(service.iconName)}
                </div>
                <h3 className="font-sans text-2xl text-black font-bold mb-1">{service.title}</h3>
                <h4 className="text-gold text-sm uppercase tracking-widest mb-4 font-extrabold">{service.subtitle}</h4>
                <p className="text-black/70 leading-relaxed mb-6 font-light">
                  {service.description}
                </p>
                <span className="text-sm font-bold uppercase tracking-widest text-black group-hover:text-gold transition-premium flex items-center gap-2">
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