import { Link } from 'react-router-dom';
import { ArrowRight, Bed, Bath, Maximize, MapPin } from 'lucide-react';
import { useFeaturedListings } from '../hooks/useListings';
import ListingAttribution from './mls/ListingAttribution';
import { useTranslation } from '../lib/i18n';

const FeaturedListings = () => {
  const { data: featured = [], isLoading } = useFeaturedListings(6);
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28 bg-warm-ivory">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-gold text-xs uppercase tracking-[0.25em] font-lato font-semibold">{t('featured.subtitle')}</span>
            <h2 className="mt-2 font-playfair text-3xl md:text-4xl font-bold text-dark">{t('featured.title')}</h2>
          </div>
          <Link
            to="/properties"
            className="hidden md:flex items-center gap-2 text-gold font-lato font-semibold text-sm uppercase tracking-widest hover:gap-3 transition-all"
          >
            {t('featured.viewAll')} <ArrowRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-56 md:h-64 bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-7 bg-gray-200 rounded w-32" />
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                    <div className="h-4 bg-gray-200 rounded w-16" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((listing) => (
              <Link
                key={listing.id}
                to={`/property/${listing.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="relative h-56 md:h-64 overflow-hidden">
                  <img
                    src={listing.images[0] || '/images/properties/home-1.jpg'}
                    alt={listing.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width={400}
                    height={300}
                  />
                  <div className="absolute top-4 left-4 bg-gold text-white text-xs font-lato font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {listing.status}
                  </div>
                </div>
                <div className="p-6">
                  <p className="font-playfair text-2xl font-bold text-dark mb-1">
                    ${listing.price.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    <MapPin size={14} className="text-gold shrink-0" />
                    <p className="font-lato text-sm text-gray-500 line-clamp-1">{listing.address}</p>
                  </div>
                  <div className="flex gap-4 text-sm font-lato text-gray-600">
                    <span className="flex items-center gap-1"><Bed size={14} className="text-gold" /> {listing.beds} {t('featured.beds')}</span>
                    <span className="flex items-center gap-1"><Bath size={14} className="text-gold" /> {listing.baths} {t('featured.baths')}</span>
                    <span className="flex items-center gap-1"><Maximize size={14} className="text-gold" /> {listing.sqft?.toLocaleString()} {t('featured.sqft')}</span>
                  </div>
                  <ListingAttribution
                    officeName={listing.listOfficeName}
                    agentName={listing.listAgentName}
                    agentEmail={listing.listAgentEmail}
                    agentPhone={listing.listAgentPhone}
                    mlsNumber={listing.mlsNumber}
                    variant="card"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 bg-gold text-white rounded-full px-8 py-3 font-lato font-semibold text-sm uppercase tracking-widest hover:bg-gold-dark transition-all"
          >
            {t('featured.viewAllProperties')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
