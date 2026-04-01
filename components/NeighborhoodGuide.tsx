import { ArrowRight, DollarSign, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { NEIGHBORHOODS, NEIGHBORHOODS_DETAIL } from '../constants';
import { supabase } from '../lib/supabase/client';

// Map neighborhood areas to approximate El Paso zip codes
const NEIGHBORHOOD_ZIPS: Record<string, string[]> = {
  'Westside': ['79912'],
  'Upper Valley': ['79922', '79932'],
  'Northeast': ['79924', '79904'],
  'Horizon City': ['79928'],
  'Central': ['79901', '79902'],
  'Eastlake': ['79927', '79936'],
};

function useNeighborhoodCounts() {
  return useQuery({
    queryKey: ['neighborhood-counts'],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('listings')
        .select('zip_code')
        .eq('status', 'active');

      if (error || !data?.length) {
        return Object.fromEntries(Object.keys(NEIGHBORHOOD_ZIPS).map(n => [n, 0]));
      }

      const result: Record<string, number> = {};
      for (const [name, zips] of Object.entries(NEIGHBORHOOD_ZIPS)) {
        result[name] = data.filter(l => zips.includes(l.zip_code)).length;
      }
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
}

const NeighborhoodGuide = () => {
  const { data: neighborhoodCounts } = useNeighborhoodCounts();
  return (
    <section id="neighborhoods" className="relative py-24 md:py-32 lg:py-40 bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div>
            <span className="text-gold text-xs uppercase tracking-[0.25em] font-extrabold">Local Expertise</span>
            <h2 className="mt-3 font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black font-bold">
              Explore <span className="gradient-text">El Paso</span>
            </h2>
            <p className="mt-3 text-black/70 max-w-2xl font-light">
              Discover the perfect neighborhood for your lifestyle
            </p>
          </div>
          <Link
            to="/properties"
            className="hidden md:flex items-center gap-2 text-sm text-black hover:text-gold uppercase tracking-widest transition-premium group font-semibold"
          >
            View All Properties
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-premium" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {NEIGHBORHOODS.map((hood, index) => {
            const detailNeighborhood = NEIGHBORHOODS_DETAIL.find(n => n.name === hood.name);
            const linkTo = detailNeighborhood ? `/neighborhood/${detailNeighborhood.id}` : `/properties?neighborhood=${hood.name}`;

            return (
              <Link
                key={index}
                to={linkTo}
                className="neighborhood-card group relative h-48 sm:h-56 md:h-72 lg:h-96 overflow-hidden cursor-pointer hover-lift block shadow-premium hover:shadow-gold-glow transition-premium animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img
                  src={hood.image}
                  alt={hood.name}
                  className="w-full h-full object-cover transition-premium group-hover:scale-110"
                  loading="lazy"
                  width={800}
                  height={600}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-70 group-hover:opacity-80 transition-premium"></div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 p-6 w-full transform transition-premium translate-y-2 group-hover:translate-y-0">
                  <div className="border-l-2 border-gold pl-4">
                    <h3 className="font-playfair text-2xl text-white mb-2 group-hover:text-gold transition-premium font-bold">
                      {hood.name}
                    </h3>
                    <p className="text-white/80 text-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-premium delay-100 line-clamp-2 font-light">
                      {hood.description}
                    </p>
                  </div>

                  {/* Stats Preview */}
                  <div className="mt-4 grid grid-cols-2 gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-premium delay-150">
                    <div className="text-center">
                      <DollarSign size={14} className="text-gold mx-auto mb-1" />
                      <div className="text-xs text-white font-medium">
                        {detailNeighborhood ? `$${Math.round(detailNeighborhood.medianPrice / 1000)}K` : '—'}
                      </div>
                      <div className="text-[10px] text-white/50 font-light">Median</div>
                    </div>
                    <div className="text-center">
                      <HomeIcon size={14} className="text-gold mx-auto mb-1" />
                      <div className="text-xs text-white font-medium">
                        {(neighborhoodCounts?.[hood.name] ?? 0) > 0 ? neighborhoodCounts![hood.name] : '—'}
                      </div>
                      <div className="text-[10px] text-white/50 font-light">For Sale</div>
                    </div>
                  </div>

                  <div className="mt-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-premium delay-200 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gold">
                      Explore Area
                    </span>
                    <ArrowRight size={14} className="text-gold group-hover:translate-x-1 transition-premium" />
                  </div>
                </div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 shimmer"></div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white font-bold uppercase tracking-widest hover:shadow-gold-glow transition-premium shadow-premium"
          >
            View All Properties
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NeighborhoodGuide;
