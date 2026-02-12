import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { mockListings } from '../lib/mockListings';
import type { Property } from '../lib/mockListings';
import { Bed, Bath, Maximize, MapPin, Heart, Search, SlidersHorizontal, GitCompare, X, Grid3x3, Map as MapIcon } from 'lucide-react';

const Properties = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [bedrooms, setBedrooms] = useState('any');
  const [propertyType, setPropertyType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [compareList, setCompareList] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const neighborhoods = useMemo(() =>
    ['all', ...new Set(mockListings.map(p => p.neighborhood))],
    []
  );

  const filteredProperties = useMemo(() => {
    return mockListings.filter(property => {
      const matchesSearch = property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesNeighborhood = selectedNeighborhood === 'all' ||
                                 property.neighborhood === selectedNeighborhood;

      const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];

      const matchesBeds = bedrooms === 'any' || property.beds >= parseInt(bedrooms);

      const matchesType = propertyType === 'all' || property.propertyType === propertyType;

      return matchesSearch && matchesNeighborhood && matchesPrice && matchesBeds && matchesType;
    });
  }, [searchTerm, selectedNeighborhood, priceRange, bedrooms, propertyType]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCompare = (id: string) => {
    setCompareList(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 3) {
          alert('You can compare up to 3 properties at a time');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const comparedProperties = useMemo(() => {
    return mockListings.filter(p => compareList.has(p.id));
  }, [compareList]);

  return (
    <div className="bg-blackmin-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-b from-dark-charcoal to-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="font-sans text-5xl md:text-6xl text-black mb-4">
              Find Your <span className="text-gold italic">Dream Home</span>
            </h1>
            <p className="text-black/60 text-xl max-w-2xl mx-auto">
              Explore {mockListings.length} luxury properties in El Paso's finest neighborhoods
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-8 animate-fade-in-up delay-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={20} />
              <input
                type="text"
                placeholder="Search by address, neighborhood, or features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 text-black pl-12 pr-4 py-4 focus:outline-none focus:border-gold transition-all rounded-lg"
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <div className="flex justify-center animate-fade-in-up delay-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-black hover:border-gold transition-all rounded-lg"
            >
              <SlidersHorizontal size={18} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="max-w-6xl mx-auto mt-8 bg-white border border-gray-200 rounded-lg p-6 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Neighborhood Filter */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">Neighborhood</label>
                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="w-full bg-blackborder border-white/10 text-black px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
                  >
                    {neighborhoods.map(n => (
                      <option key={n} value={n}>{n === 'all' ? 'All Neighborhoods' : n}</option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-blackborder border-white/10 text-black px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
                  >
                    <option value="all">All Types</option>
                    <option value="Single Family">Single Family</option>
                    <option value="Condo">Condo</option>
                    <option value="Townhouse">Townhouse</option>
                    <option value="Multi-Family">Multi-Family</option>
                  </select>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">Bedrooms</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-blackborder border-white/10 text-black px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
                  >
                    <option value="any">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">
                    Max Price: ${(priceRange[1] / 1000).toFixed(0)}K
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2000000"
                    step="50000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full accent-gold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Property Grid/Map */}
      <section className={`py-20 px-4 bg-warm-white ${compareList.size > 0 ? 'pb-32' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <p className="text-black/60">
              Showing <span className="text-gold font-bold">{filteredProperties.length}</span> properties
            </p>

            {/* Grid/Map Toggle */}
            <div className="flex gap-2 bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gold text-dark font-semibold'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                <Grid3x3 size={18} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
                  viewMode === 'map'
                    ? 'bg-gold text-dark font-semibold'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                <MapIcon size={18} />
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
              <p className="text-black/60 text-xl">No properties match your criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedNeighborhood('all');
                  setPriceRange([0, 2000000]);
                  setBedrooms('any');
                  setPropertyType('all');
                }}
                className="mt-4 px-6 py-3 bg-gold text-dark font-bold uppercase tracking-widest hover:shadow-gold-glow transition-all rounded"
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFavorite={favorites.has(property.id)}
                  onToggleFavorite={() => toggleFavorite(property.id)}
                  isComparing={compareList.has(property.id)}
                  onToggleCompare={() => toggleCompare(property.id)}
                  delay={index * 100}
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 h-[600px]">
              <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden border border-gray-200">
                {/* TODO: Replace with Google Maps / Mapbox when MLS API is integrated */}
                <div className="text-center text-gray-500 p-8">
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-gold" />
                  <p className="font-playfair text-2xl font-semibold text-black mb-2">Interactive Map Coming Soon</p>
                  <p className="text-sm text-black/60">MLS integration in progress</p>
                  <p className="text-xs text-black/40 mt-4">El Paso, TX (31.7619, -106.4850)</p>
                </div>
              </div>
              <div className="w-80 overflow-y-auto space-y-3 hidden lg:block">
                {filteredProperties.map(p => (
                  <CompactPropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Compare Bar */}
      {compareList.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gold shadow-2xl z-40 animate-slide-in-up">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <GitCompare className="text-gold" size={24} />
              <div>
                <p className="text-black font-bold">Compare Properties</p>
                <p className="text-black/60 text-sm">{compareList.size} selected (max 3)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowComparison(true)}
                disabled={compareList.size < 2}
                className="px-6 py-3 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target text-sm sm:text-base"
              >
                Compare Now
              </button>
              <button
                onClick={() => setCompareList(new Set())}
                className="px-4 py-3 border border-gold text-gold hover:bg-gold hover:text-dark transition-colors touch-target"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && comparedProperties.length >= 2 && (
        <ComparisonModal
          properties={comparedProperties}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* MLS Disclaimer - REQUIRED */}
      <section className="py-12 px-4 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-6">
            <img
              src="/images/logo/greater-el-paso-realtors.jpg"
              alt="Greater El Paso Association of REALTORS®"
              className="h-16 w-auto"
            />
          </div>
          <p className="text-xs text-black/60 font-lato leading-relaxed text-center max-w-4xl mx-auto">
            Based on information from the Greater El Paso Association of REALTORS® MLS.
            Information is provided exclusively for consumers' personal, non-commercial use
            and may not be used for any purpose other than to identify prospective properties
            consumers may be interested in purchasing. All information deemed reliable but not guaranteed.
            Copyright 2026 Greater El Paso Association of Realtors Multiple Listing Service. All Rights Reserved.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isComparing: boolean;
  onToggleCompare: () => void;
  delay: number;
}

const PropertyCard = ({ property, isFavorite, onToggleFavorite, isComparing, onToggleCompare, delay }: PropertyCardProps) => {
  return (
    <Link
      to={`/property/${property.id}`}
      className="group bg-white border border-white/10 hover:border-gold/50 transition-all duration-300 overflow-hidden animate-fade-in-up hover:scale-[1.02]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.image}
          alt={`${property.address}, ${property.city}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />

        {/* Status Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded ${
          property.status === 'Active' ? 'bg-gold text-dark' :
          property.status === 'Pending' ? 'bg-orange-500 text-white' :
          'bg-gray-500 text-white'
        }`}>
          {property.status === 'Active' ? 'For Sale' : property.status}
        </div>

        {/* MLS Badge */}
        <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/70 text-white text-[10px] font-mono rounded">
          MLS# {property.mlsNumber}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite();
          }}
          className="absolute top-4 right-4 p-2 bg-dark/80 hover:bg-gold transition-colors rounded-full"
        >
          <Heart
            size={20}
            className={isFavorite ? 'fill-gold text-gold' : 'text-white'}
          />
        </button>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-60 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Price */}
        <div className="text-2xl font-sans font-bold text-gold mb-1">
          ${property.price.toLocaleString()}
        </div>

        {/* Address */}
        <div className="flex items-center gap-2 text-gray-800 text-sm font-medium mb-1">
          <MapPin size={14} className="text-gold shrink-0" />
          <span className="line-clamp-1">{property.address}</span>
        </div>
        <p className="text-gray-500 text-xs mb-4 pl-[22px]">{property.city}, {property.state} {property.zip}</p>

        {/* Features */}
        <div className="flex items-center gap-4 text-gray-700 text-sm border-t border-gray-100 pt-4">
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

        {/* Days on Market */}
        {property.daysOnMarket <= 14 && (
          <div className="mt-3 text-xs font-semibold text-gold">
            New Listing - {property.daysOnMarket} days on market
          </div>
        )}

        {/* Compare Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleCompare();
          }}
          className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border transition-all text-sm font-medium rounded ${
            isComparing
              ? 'bg-gold text-dark border-gold'
              : 'bg-transparent text-gold border-gold hover:bg-gold hover:text-dark'
          }`}
        >
          <GitCompare size={16} />
          {isComparing ? 'Added to Compare' : 'Add to Compare'}
        </button>
      </div>
    </Link>
  );
};

// Comparison Modal Component
interface ComparisonModalProps {
  properties: Property[];
  onClose: () => void;
}

const ComparisonModal = ({ properties, onClose }: ComparisonModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto animate-fade-in">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-black/90 py-4 z-10">
            <div>
              <h2 className="text-3xl font-sans text-black mb-2">Property Comparison</h2>
              <p className="text-black/60">Compare up to 3 properties side-by-side</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white border border-gray-200 hover:bg-gold hover:border-gold rounded-full transition-all group touch-target"
            >
              <X className="text-gold group-hover:text-dark transition-colors" size={24} />
            </button>
          </div>

          {/* Comparison Table */}
          <div className="glass-strong rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 sm:p-6 text-gold text-xs uppercase tracking-wider sticky left-0 bg-white">
                    Feature
                  </th>
                  {properties.map((property) => (
                    <th key={property.id} className="p-4 sm:p-6 min-w-[250px]">
                      <Link
                        to={`/property/${property.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={property.image}
                          alt={`${property.address}, ${property.city}`}
                          className="w-full h-32 object-cover rounded mb-3"
                          loading="lazy"
                        />
                        <h3 className="text-black font-semibold text-sm mb-1 line-clamp-2">
                          {property.address}
                        </h3>
                        <p className="text-black/60 text-xs line-clamp-1">{property.city}, {property.state} {property.zip}</p>
                        <p className="text-black/40 text-[10px] font-mono mt-1">MLS# {property.mlsNumber}</p>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* Price */}
                <tr className="border-b border-white/5">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">Price</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-gold font-sans text-xl">
                      ${p.price.toLocaleString()}
                    </td>
                  ))}
                </tr>

                {/* Bedrooms */}
                <tr className="border-b border-white/5">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">Bedrooms</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">{p.beds}</td>
                  ))}
                </tr>

                {/* Bathrooms */}
                <tr className="border-b border-white/5">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">Bathrooms</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">{p.baths}</td>
                  ))}
                </tr>

                {/* Square Feet */}
                <tr className="border-b border-white/5">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">Square Feet</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">{p.sqft.toLocaleString()}</td>
                  ))}
                </tr>

                {/* Year Built */}
                <tr className="border-b border-white/5">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">Year Built</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">{p.yearBuilt}</td>
                  ))}
                </tr>

                {/* Property Type */}
                <tr className="border-b border-white/5">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">Property Type</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">{p.propertyType}</td>
                  ))}
                </tr>

                {/* Neighborhood */}
                <tr className="border-b border-white/5">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">Neighborhood</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">{p.neighborhood}</td>
                  ))}
                </tr>

                {/* Days on Market */}
                <tr className="border-b border-white/5">
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">Days on Market</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6 text-black">{p.daysOnMarket}</td>
                  ))}
                </tr>

                {/* Status */}
                <tr>
                  <td className="p-4 sm:p-6 text-black/60 font-medium sticky left-0 bg-white">Status</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-6">
                      <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded ${
                        p.status === 'Active' ? 'bg-gold text-dark' :
                        p.status === 'Pending' ? 'bg-orange-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {p.status === 'Active' ? 'For Sale' : p.status}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {properties.map((property) => (
              <Link
                key={property.id}
                to={`/property/${property.id}`}
                className="px-6 py-3 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white transition-colors text-sm"
              >
                View {property.neighborhood} Property
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact Property Card for Map View Sidebar
function CompactPropertyCard({ property }: { property: Property }) {
  return (
    <Link
      to={`/property/${property.id}`}
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all group"
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={property.image}
          alt={property.address}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {property.status === "Pending" && (
          <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Pending
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xl font-bold text-black font-playfair">
          ${property.price.toLocaleString()}
        </p>
        <div className="flex items-center gap-2 text-xs text-black/60 mt-1 font-lato">
          <span>{property.beds} bd</span>
          <span>•</span>
          <span>{property.baths} ba</span>
          <span>•</span>
          <span>{property.sqft.toLocaleString()} sf</span>
        </div>
        <p className="text-xs text-black/70 mt-2 font-lato">{property.address}</p>
        <p className="text-xs text-black/50 font-lato">
          {property.city}, {property.state}
        </p>
      </div>
    </Link>
  );
}

export default Properties;
