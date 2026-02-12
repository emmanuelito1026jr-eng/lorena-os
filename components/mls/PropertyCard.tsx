import React from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin, Heart } from 'lucide-react';
import type { PropertyDisplayData } from '../../lib/mls/types';
import ListingAttribution from './ListingAttribution';

interface PropertyCardProps {
  property: PropertyDisplayData;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  delay?: number;
}

const PropertyCard = React.memo(({
  property,
  onFavorite,
  isFavorite = false,
  delay = 0,
}: PropertyCardProps) => {
  return (
    <Link
      to={`/property/${property.id}`}
      className="group bg-white border border-gray-200 hover:border-gold/50 transition-all duration-300 overflow-hidden animate-fade-in-up hover:shadow-premium"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
        <img
          src={property.images[0] || '/images/properties/home-1.jpg'}
          alt={`${property.address}, ${property.city}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />

        {/* Status Badge */}
        <div
          className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            property.status === 'For Sale'
              ? 'bg-gold text-dark'
              : property.status === 'Pending'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-500 text-white'
          }`}
        >
          {property.status}
        </div>

        {/* MLS Badge */}
        <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/70 text-white text-[10px] font-mono">
          MLS# {property.mlsNumber}
        </div>

        {/* Favorite Button */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavorite(property.id);
            }}
            className="absolute top-4 right-4 p-2 bg-dark/80 hover:bg-gold transition-colors rounded-full"
            aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart
              size={20}
              className={isFavorite ? 'fill-gold text-gold' : 'text-white'}
            />
          </button>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-60 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 md:p-6">
        {/* Price */}
        <div className="text-2xl font-sans font-bold text-gold mb-1">
          ${property.price.toLocaleString()}
        </div>

        {/* Address */}
        <div className="flex items-center gap-2 text-gray-800 text-sm font-medium mb-1">
          <MapPin size={14} className="text-gold shrink-0" />
          <span className="line-clamp-1">{property.address}</span>
        </div>
        <p className="text-gray-500 text-xs mb-4 pl-[22px]">
          {property.city}, {property.state} {property.zip}
        </p>

        {/* Features */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-gray-700 text-sm border-t border-gray-100 pt-4">
          <div className="flex items-center gap-1">
            <Bed size={16} className="text-gold" />
            <span>{property.beds} Beds</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath size={16} className="text-gold" />
            <span>{property.baths} Baths</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize size={16} className="text-gold" />
            <span>{property.sqft.toLocaleString()} sqft</span>
          </div>
        </div>

        {/* Property Type & Year */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>{property.propertyType}</span>
          <span>Built {property.yearBuilt}</span>
        </div>

        {/* New Listing Badge */}
        {property.daysOnMarket <= 14 && (
          <div className="mt-3 text-xs font-semibold text-gold">
            New Listing &mdash; {property.daysOnMarket} days on market
          </div>
        )}

        {/* REQUIRED: Listing Attribution (GEPAR Section 18) */}
        <ListingAttribution
          officeName={property.listOfficeName}
          agentName={property.listAgentName}
          mlsNumber={property.mlsNumber}
          variant="card"
        />
      </div>
    </Link>
  );
});

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;
