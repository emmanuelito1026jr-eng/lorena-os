import { ArrowRight, TrendingUp, Users, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NEIGHBORHOODS, NEIGHBORHOODS_DETAIL } from '../constants';

const NeighborhoodGuide = () => {
  return (
    <section id="neighborhoods" className="relative py-24 bg-dark overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 animate-fade-in-up">
          <div>
            <span className="text-gold text-xs uppercase tracking-[0.25em]">Local Expertise</span>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl text-ivory">
              Explore <span className="gradient-text">El Paso</span>
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl">
              Discover the perfect neighborhood for your lifestyle
            </p>
          </div>
          <a
            href="#/properties"
            className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-gold uppercase tracking-widest transition-colors group"
          >
            View All Properties
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {NEIGHBORHOODS.map((hood, index) => {
            const detailNeighborhood = NEIGHBORHOODS_DETAIL.find(n => n.name === hood.name);
            const linkTo = detailNeighborhood ? `#/neighborhood/${detailNeighborhood.id}` : `#/properties?neighborhood=${hood.name}`;

            return (
              <a
                key={index}
                href={linkTo}
                className="group relative h-96 overflow-hidden cursor-pointer rounded-lg animate-fade-in-up hover-lift block"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img
                  src={hood.image}
                  alt={hood.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                {/* Gold Accent Border - Appears on Hover */}
                <div className="absolute inset-0 border-2 border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 p-6 w-full transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="border-l-2 border-gold pl-4">
                    <h3 className="font-serif text-2xl text-ivory mb-2 group-hover:text-gold transition-colors">
                      {hood.name}
                    </h3>
                    <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 line-clamp-2">
                      {hood.description}
                    </p>
                  </div>

                  {/* Stats Preview */}
                  <div className="mt-4 grid grid-cols-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
                    <div className="text-center">
                      <TrendingUp size={16} className="text-gold mx-auto mb-1" />
                      <div className="text-xs text-gray-400">Growth</div>
                    </div>
                    <div className="text-center">
                      <Users size={16} className="text-gold mx-auto mb-1" />
                      <div className="text-xs text-gray-400">Community</div>
                    </div>
                    <div className="text-center">
                      <HomeIcon size={16} className="text-gold mx-auto mb-1" />
                      <div className="text-xs text-gray-400">Homes</div>
                    </div>
                  </div>

                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gold">
                      Explore Area
                    </span>
                    <ArrowRight size={14} className="text-gold group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 shimmer"></div>
              </a>
            );
          })}
        </div>

        <div className="mt-12 text-center md:hidden">
          <a
            href="#/properties"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white transition-colors"
          >
            View All Properties
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default NeighborhoodGuide;
