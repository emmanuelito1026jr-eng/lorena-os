import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { NEIGHBORHOODS_DETAIL } from '../constants';
import { getListings } from '../lib/mls/mockData';
import { MapPin, TrendingUp, Users, DollarSign, School, Home, Award, ChevronLeft } from 'lucide-react';

const NeighborhoodDetail = () => {
  const { id } = useParams<{ id: string }>();
  const neighborhood = NEIGHBORHOODS_DETAIL.find(n => n.id === id);

  if (!neighborhood) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-sans text-gold mb-4">Neighborhood Not Found</h1>
          <Link to="/#neighborhoods" className="text-white hover:text-gold">
            ← Back to Neighborhoods
          </Link>
        </div>
      </div>
    );
  }

  const neighborhoodProperties = getListings({ neighborhoods: [neighborhood.name] });

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 h-[45vh] sm:h-[55vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={neighborhood.image}
            alt={neighborhood.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-dark"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <Link
            to="/#neighborhoods"
            className="inline-flex items-center gap-2 text-gold hover:text-white mb-6 animate-fade-in"
          >
            <ChevronLeft size={16} />
            Back to Neighborhoods
          </Link>

          <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-white mb-4 animate-fade-in-up delay-100">
            {neighborhood.name}
          </h1>
          <p className="text-white/80 text-xl max-w-2xl mx-auto animate-fade-in-up delay-200">
            {neighborhood.description}
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-premium p-4 sm:p-5 md:p-6 text-center hover-lift animate-fade-in-up">
              <DollarSign className="text-gold mx-auto mb-3" size={32} />
              <div className="text-3xl font-sans text-black mb-1">
                ${(neighborhood.medianPrice / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-black/60 uppercase tracking-wider">Median Price</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-premium p-4 sm:p-5 md:p-6 text-center hover-lift animate-fade-in-up delay-100">
              <Users className="text-gold mx-auto mb-3" size={32} />
              <div className="text-3xl font-sans text-black mb-1">
                {(neighborhood.demographics.population / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-black/60 uppercase tracking-wider">Population</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-premium p-4 sm:p-5 md:p-6 text-center hover-lift animate-fade-in-up delay-200">
              <TrendingUp className="text-gold mx-auto mb-3" size={32} />
              <div className="text-3xl font-sans text-black mb-1">
                {neighborhood.demographics.homeownership}%
              </div>
              <div className="text-xs text-black/60 uppercase tracking-wider">Homeownership</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-premium p-4 sm:p-5 md:p-6 text-center hover-lift animate-fade-in-up delay-300">
              <Home className="text-gold mx-auto mb-3" size={32} />
              <div className="text-3xl font-sans text-black mb-1">
                {neighborhoodProperties.length}
              </div>
              <div className="text-xs text-black/60 uppercase tracking-wider">Available Homes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-12">
              {/* Price Range */}
              <div className="animate-fade-in-up">
                <h2 className="text-3xl font-sans text-gold mb-6">Price Range</h2>
                <div className="bg-white border border-gray-200 shadow-premium rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-sm text-black/60 uppercase tracking-wider mb-1">Low</div>
                      <div className="text-2xl font-sans text-black">
                        ${(neighborhood.priceRange[0] / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <div className="flex-1 mx-8">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold to-gold-light"></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-black/60 uppercase tracking-wider mb-1">High</div>
                      <div className="text-2xl font-sans text-black">
                        ${(neighborhood.priceRange[1] / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schools */}
              <div className="animate-fade-in-up delay-100">
                <h2 className="text-3xl font-sans text-gold mb-6">Top-Rated Schools</h2>
                <div className="space-y-4">
                  {neighborhood.schools.map((school, index) => (
                    <div key={index} className="bg-white border border-gray-200 shadow-premium rounded-lg p-6 hover-lift">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <School className="text-gold" size={20} />
                            <h3 className="text-xl text-black font-semibold">{school.name}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-black/60">
                            <span>{school.type}</span>
                            <span>•</span>
                            <span>{school.distance} miles away</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-gold/20 px-3 py-1 rounded-full">
                          <Award size={16} className="text-gold" />
                          <span className="text-gold font-bold">{school.rating}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="animate-fade-in-up delay-200">
                <h2 className="text-3xl font-sans text-gold mb-6">Amenities & Features</h2>
                <div className="bg-white border border-gray-200 shadow-premium rounded-lg p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {neighborhood.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gold rounded-full"></div>
                        <span className="text-black/80">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div className="animate-fade-in-up delay-300">
                <h2 className="text-3xl font-sans text-gold mb-6">Demographics</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 shadow-premium rounded-lg p-6">
                    <div className="text-sm text-black/60 uppercase tracking-wider mb-2">Median Age</div>
                    <div className="text-3xl font-sans text-black">{neighborhood.demographics.medianAge}</div>
                  </div>
                  <div className="bg-white border border-gray-200 shadow-premium rounded-lg p-6">
                    <div className="text-sm text-black/60 uppercase tracking-wider mb-2">Median Income</div>
                    <div className="text-3xl font-sans text-black">
                      ${(neighborhood.demographics.medianIncome / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Available Properties */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="text-2xl font-sans text-gold mb-6 animate-fade-in-up">
                  Available in {neighborhood.name}
                </h3>

                {neighborhoodProperties.length > 0 ? (
                  <div className="space-y-4">
                    {neighborhoodProperties.map((property, index) => (
                      <Link
                        key={property.id}
                        to={`/property/${property.id}`}
                        className="block bg-white border border-gray-200 shadow-premium rounded-lg overflow-hidden hover-lift animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="relative h-48">
                          <img
                            src={property.images[0]}
                            alt={property.address}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-2 right-2 bg-gold text-dark px-2 py-1 text-xs font-bold">
                            ${(property.price / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="text-black font-semibold mb-2 line-clamp-2">
                            {property.address}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-black/60">
                            <span>{property.beds} beds</span>
                            <span>•</span>
                            <span>{property.baths} baths</span>
                          </div>
                        </div>
                      </Link>
                    ))}

                    <Link
                      to={`/properties?neighborhood=${neighborhood.name}`}
                      className="block text-center px-6 py-3 border border-gold text-gold hover:bg-gold hover:text-dark transition-all font-bold uppercase tracking-widest text-sm"
                    >
                      View All Properties
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 shadow-premium rounded-lg p-6 text-center">
                    <p className="text-black/60 mb-4">No properties currently available</p>
                    <Link
                      to="/properties"
                      className="text-gold hover:text-gold-dark text-sm uppercase tracking-wider"
                    >
                      Browse All Listings →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NeighborhoodDetail;
