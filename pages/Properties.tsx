import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PROPERTIES } from '../constants';
import { Property } from '../types';
import { Bed, Bath, Maximize, MapPin, Heart, Search, SlidersHorizontal } from 'lucide-react';

const Properties = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [bedrooms, setBedrooms] = useState('any');
  const [propertyType, setPropertyType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const neighborhoods = useMemo(() =>
    ['all', ...new Set(PROPERTIES.map(p => p.neighborhood))],
    []
  );

  const filteredProperties = useMemo(() => {
    return PROPERTIES.filter(property => {
      const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  return (
    <div className="bg-dark min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-b from-dark-charcoal to-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="font-serif text-5xl md:text-6xl text-ivory mb-4">
              Find Your <span className="text-gold italic">Dream Home</span>
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              Explore {PROPERTIES.length} luxury properties in El Paso's finest neighborhoods
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
                className="w-full bg-dark-card border border-gold/30 text-ivory pl-12 pr-4 py-4 focus:outline-none focus:border-gold transition-all rounded-lg"
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <div className="flex justify-center animate-fade-in-up delay-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-dark-card border border-gold/30 text-ivory hover:border-gold transition-all rounded-lg"
            >
              <SlidersHorizontal size={18} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="max-w-6xl mx-auto mt-8 bg-dark-card border border-gold/20 rounded-lg p-6 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Neighborhood Filter */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Neighborhood</label>
                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="w-full bg-dark border border-white/10 text-ivory px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
                  >
                    {neighborhoods.map(n => (
                      <option key={n} value={n}>{n === 'all' ? 'All Neighborhoods' : n}</option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-dark border border-white/10 text-ivory px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
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
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Bedrooms</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-dark border border-white/10 text-ivory px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
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
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
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

      {/* Property Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <p className="text-gray-400">
              Showing <span className="text-gold font-bold">{filteredProperties.length}</span> properties
            </p>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-xl">No properties match your criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedNeighborhood('all');
                  setPriceRange([0, 2000000]);
                  setBedrooms('any');
                  setPropertyType('all');
                }}
                className="mt-4 px-6 py-3 bg-gold text-dark font-bold hover:bg-white transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFavorite={favorites.has(property.id)}
                  onToggleFavorite={() => toggleFavorite(property.id)}
                  delay={index * 100}
                />
              ))}
            </div>
          )}
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
  delay: number;
}

const PropertyCard = ({ property, isFavorite, onToggleFavorite, delay }: PropertyCardProps) => {
  return (
    <Link
      to={`/property/${property.id}`}
      className="group bg-dark-card border border-white/10 hover:border-gold/50 transition-all duration-300 overflow-hidden animate-fade-in-up hover:scale-[1.02]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />

        {/* Status Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase tracking-wider ${
          property.status === 'For Sale' ? 'bg-gold text-dark' :
          property.status === 'Pending' ? 'bg-orange-500 text-white' :
          'bg-gray-500 text-white'
        }`}>
          {property.status}
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
            className={isFavorite ? 'fill-gold text-gold' : 'text-ivory'}
          />
        </button>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-60" />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Price */}
        <div className="text-2xl font-serif text-gold mb-2">
          ${property.price.toLocaleString()}
        </div>

        {/* Title */}
        <h3 className="text-ivory font-semibold text-lg mb-2 line-clamp-2 group-hover:text-gold transition-colors">
          {property.title}
        </h3>

        {/* Address */}
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
          <MapPin size={14} className="text-gold shrink-0" />
          <span className="line-clamp-1">{property.address}</span>
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 text-gray-300 text-sm border-t border-white/10 pt-4">
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

        {/* Days on Market */}
        {property.daysOnMarket < 30 && (
          <div className="mt-4 text-xs text-gold">
            🔥 New - {property.daysOnMarket} days on market
          </div>
        )}
      </div>
    </Link>
  );
};

export default Properties;
