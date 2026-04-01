import { PHONE_NUMBER } from '../constants';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactForm from '../components/ContactForm';
import ListingAttribution from '../components/mls/ListingAttribution';
import IDXCompliance from '../components/mls/IDXCompliance';
import { useListingDetail, useMLSSyncStatus } from '../hooks/useListings';
import { logPropertyView } from '../lib/mls/auditTrail';
import PropertyViewGate from '../components/lead-capture/PropertyViewGate';
import {
  Bed, Bath, Maximize, MapPin, Home, Heart, Share2,
  ChevronLeft, ChevronRight, X, Calculator, Building,
  Phone, MessageSquare, Calendar, AlertTriangle
} from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: result, isLoading } = useListingDetail(id || '');
  const property = result?.listing || null;
  usePageMeta({
    title: property ? `${property.address} — El Paso Home for Sale` : 'Property Not Found',
    description: property ? `${property.beds} bed, ${property.baths} bath home in ${property.neighborhood}, El Paso TX. $${property.price.toLocaleString()}. Listed by Lorena Ontiveros-Ortega.` : undefined,
    canonicalUrl: property ? `https://casasenelpasotx.com/property/${id}` : undefined,
    jsonLd: property ? {
      '@type': 'RealEstateListing',
      name: `${property.beds} Bedroom Home at ${property.address}`,
      url: `https://casasenelpasotx.com/property/${id}`,
      datePosted: property.listDate || undefined,
      price: `$${property.price.toLocaleString()}`,
      priceCurrency: 'USD',
      address: {
        '@type': 'PostalAddress',
        streetAddress: property.address,
        addressLocality: property.city,
        addressRegion: property.state,
        postalCode: property.zip,
      },
      floorSize: { '@type': 'QuantitativeValue', value: property.sqft, unitCode: 'FTK' },
      numberOfRooms: property.beds,
      numberOfBathroomsTotal: property.baths,
      yearBuilt: property.yearBuilt,
      image: property.images[0] || undefined,
      broker: {
        '@type': 'RealEstateAgent',
        name: 'Lorena Ontiveros-Ortega',
        url: 'https://casasenelpasotx.com',
        telephone: `+1-${PHONE_NUMBER}`,
      },
    } : undefined,
  });

  const { data: syncStatus } = useMLSSyncStatus();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  // Log property view for GEPAR audit trail
  useEffect(() => {
    if (property) {
      logPropertyView(property.id);
    }
  }, [property]);

  // Keyboard navigation for lightbox (← → Esc)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showGallery) return;
    if (e.key === 'Escape') setShowGallery(false);
    if (e.key === 'ArrowRight') setCurrentImageIndex(prev => (prev + 1) % (property?.images.length || 1));
    if (e.key === 'ArrowLeft') setCurrentImageIndex(prev => (prev - 1 + (property?.images.length || 1)) % (property?.images.length || 1));
  }, [showGallery, property?.images.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="pt-20">
          <div className="h-[50vh] bg-gray-200 animate-pulse" />
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                <div className="h-12 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="flex gap-6">
                  <div className="h-16 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-16 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-16 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
              <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-playfair text-gold mb-4">Property Not Found</h1>
          <Link to="/properties" className="text-black hover:text-gold">
            &larr; Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Stale Data Warning */}
      {syncStatus?.isStale && (
        <div className="fixed top-20 left-0 right-0 z-30 bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-800 text-sm">
            <AlertTriangle size={16} />
            <span>MLS data may be outdated. Last updated {syncStatus.hoursOld > 24 ? `${Math.floor(syncStatus.hoursOld / 24)} days` : `${Math.floor(syncStatus.hoursOld)} hours`} ago.</span>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <section className="relative pt-20">
        <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] bg-gray-100">
          <img
            src={property.images[currentImageIndex]}
            alt={`${property.address}, ${property.city}`}
            className="w-full h-full object-cover cursor-pointer"
            width={800}
            height={600}
            onClick={() => setShowGallery(true)}
          />

          {/* Navigation Arrows */}
          {property.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-dark/80 hover:bg-gold transition-colors rounded-full"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-dark/80 hover:bg-gold transition-colors rounded-full"
                aria-label="Next image"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-dark/80 text-white text-sm rounded-full">
            {currentImageIndex + 1} / {property.images.length}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="p-3 bg-dark/80 hover:bg-gold transition-colors rounded-full">
              <Heart size={20} className="text-white" />
            </button>
            <button className="p-3 bg-dark/80 hover:bg-gold transition-colors rounded-full">
              <Share2 size={20} className="text-white" />
            </button>
          </div>

          {/* Status Badge */}
          <div className={`absolute top-4 left-4 px-4 py-2 text-sm font-bold uppercase tracking-wider ${
            property.status === 'For Sale' ? 'bg-gold text-dark' :
            property.status === 'Pending' ? 'bg-orange-500 text-white' :
            'bg-gray-500 text-white'
          }`}>
            {property.status}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {property.images.length > 1 && (
          <div className="max-w-7xl mx-auto px-4 -mt-8 sm:-mt-12 md:-mt-16 relative z-10">
            <div className="flex gap-2 overflow-x-auto pb-4">
              {property.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded overflow-hidden border-2 transition-all ${
                    index === currentImageIndex ? 'border-gold' : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" width={800} height={600} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className="animate-fade-in-up">
                <Link to="/properties" className="text-gold hover:text-black flex items-center gap-2 mb-4">
                  <ChevronLeft size={16} />
                  Back to Properties
                </Link>

                <div className="flex items-center gap-2 text-black/60 mb-4">
                  <MapPin size={18} className="text-gold" />
                  <span className="text-lg">{property.address}, {property.city}, {property.state} {property.zip}</span>
                </div>

                <div className="text-3xl sm:text-4xl md:text-5xl font-playfair text-gold mb-6">
                  ${property.price.toLocaleString()}
                </div>

                {/* Key Stats */}
                <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Bed size={24} className="text-gold" />
                    <div>
                      <div className="text-2xl text-black font-bold">{property.beds}</div>
                      <div className="text-xs text-black/60 uppercase tracking-wider">Bedrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath size={24} className="text-gold" />
                    <div>
                      <div className="text-2xl text-black font-bold">{property.baths}</div>
                      <div className="text-xs text-black/60 uppercase tracking-wider">Bathrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize size={24} className="text-gold" />
                    <div>
                      <div className="text-2xl text-black font-bold">{property.sqft.toLocaleString()}</div>
                      <div className="text-xs text-black/60 uppercase tracking-wider">Square Feet</div>
                    </div>
                  </div>
                  {property.lotSize && (
                    <div className="flex items-center gap-2">
                      <Building size={24} className="text-gold" />
                      <div>
                        <div className="text-2xl text-black font-bold">{property.lotSize}</div>
                        <div className="text-xs text-black/60 uppercase tracking-wider">Acres</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="animate-fade-in-up delay-100">
                <h2 className="text-2xl font-playfair text-gold mb-4">Property Description</h2>
                <p className="text-black/80 leading-relaxed text-lg">
                  {property.description}
                </p>
              </div>

              {/* Features */}
              {property.features.length > 0 && (
                <div className="animate-fade-in-up delay-200">
                  <h2 className="text-2xl font-playfair text-gold mb-4">Property Features</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-black/80 bg-white border border-gray-200 px-4 py-3 rounded"
                      >
                        <div className="w-2 h-2 bg-gold rounded-full" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Details */}
              <div className="animate-fade-in-up delay-300">
                <h2 className="text-2xl font-playfair text-gold mb-4">Property Details</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="border-b border-gray-200 pb-4">
                      <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Property Type</div>
                      <div className="text-black font-medium">{property.propertyType}</div>
                    </div>
                    <div className="border-b border-gray-200 pb-4">
                      <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Year Built</div>
                      <div className="text-black font-medium">{property.yearBuilt}</div>
                    </div>
                    <div className="border-b border-gray-200 pb-4">
                      <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Days on Market</div>
                      <div className="text-black font-medium">{property.daysOnMarket} days</div>
                    </div>
                    <div className="border-b border-gray-200 pb-4">
                      <div className="text-xs text-black/60 uppercase tracking-wider mb-1">MLS Number</div>
                      <div className="text-black font-medium font-mono">{property.mlsNumber}</div>
                    </div>
                    <div className="border-b border-gray-200 pb-4">
                      <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Neighborhood</div>
                      <div className="text-black font-medium">{property.neighborhood}</div>
                    </div>
                    <div className="border-b border-gray-200 pb-4">
                      <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Status</div>
                      <div className="text-black font-medium">{property.status}</div>
                    </div>
                    {property.halfBaths ? (
                      <div className="border-b border-gray-200 pb-4">
                        <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Half Baths</div>
                        <div className="text-black font-medium">{property.halfBaths}</div>
                      </div>
                    ) : null}
                    {property.garageSpaces ? (
                      <div className="border-b border-gray-200 pb-4">
                        <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Garage</div>
                        <div className="text-black font-medium">{property.garageSpaces} spaces</div>
                      </div>
                    ) : null}
                    {property.stories ? (
                      <div className="border-b border-gray-200 pb-4">
                        <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Stories</div>
                        <div className="text-black font-medium">{property.stories}</div>
                      </div>
                    ) : null}
                    {property.pricePerSqft ? (
                      <div className="border-b border-gray-200 pb-4">
                        <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Price per Sq Ft</div>
                        <div className="text-black font-medium">${property.pricePerSqft}</div>
                      </div>
                    ) : null}
                    {property.hoaFee ? (
                      <div className="border-b border-gray-200 pb-4">
                        <div className="text-xs text-black/60 uppercase tracking-wider mb-1">HOA Fee</div>
                        <div className="text-black font-medium">${property.hoaFee}{property.hoaFrequency ? `/${property.hoaFrequency}` : '/mo'}</div>
                      </div>
                    ) : null}
                    {property.taxAmount ? (
                      <div className="border-b border-gray-200 pb-4">
                        <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Annual Tax</div>
                        <div className="text-black font-medium">${property.taxAmount.toLocaleString()}{property.taxYear ? ` (${property.taxYear})` : ''}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Schools */}
              {(property.schoolDistrict || property.elementarySchool || property.middleSchool || property.highSchool) && (
                <div className="animate-fade-in-up delay-350">
                  <h2 className="text-2xl font-playfair text-gold mb-4">Schools</h2>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {property.schoolDistrict && (
                        <div>
                          <div className="text-xs text-black/60 uppercase tracking-wider mb-1">School District</div>
                          <div className="text-black font-medium">{property.schoolDistrict}</div>
                        </div>
                      )}
                      {property.elementarySchool && (
                        <div>
                          <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Elementary</div>
                          <div className="text-black font-medium">{property.elementarySchool}</div>
                        </div>
                      )}
                      {property.middleSchool && (
                        <div>
                          <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Middle School</div>
                          <div className="text-black font-medium">{property.middleSchool}</div>
                        </div>
                      )}
                      {property.highSchool && (
                        <div>
                          <div className="text-xs text-black/60 uppercase tracking-wider mb-1">High School</div>
                          <div className="text-black font-medium">{property.highSchool}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* REQUIRED: Listing Attribution (GEPAR Section 18) */}
              <div className="animate-fade-in-up delay-350">
                <ListingAttribution
                  officeName={property.listOfficeName}
                  agentName={property.listAgentName}
                  agentEmail={property.listAgentEmail}
                  agentPhone={property.listAgentPhone}
                  mlsNumber={property.mlsNumber}
                  lastUpdated={property.lastUpdated}
                  variant="detail"
                />
              </div>

              {/* Virtual Tour */}
              {property.virtualTour && (
                <div className="animate-fade-in-up">
                  <a
                    href={property.virtualTour}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-dark font-bold uppercase tracking-widest hover:shadow-gold-glow transition-premium"
                  >
                    <Home size={18} />
                    View Virtual Tour
                  </a>
                </div>
              )}

              {/* Mortgage Calculator Button */}
              <div className="animate-fade-in-up delay-400">
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white hover:text-gold border-2 border-gold transition-colors"
                >
                  <Calculator size={20} />
                  {showCalculator ? 'Hide' : 'Show'} Mortgage Calculator
                </button>

                {showCalculator && (
                  <div className="mt-6">
                    <MortgageCalculator price={property.price} />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:col-span-1" id="contact-form">
              <div className="sticky top-24 animate-fade-in-up delay-500">
                <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-2xl">
                  <h3 className="font-playfair text-2xl text-center text-black mb-2">
                    Schedule a Showing
                  </h3>
                  <p className="text-black/60 text-center text-sm mb-6">
                    Contact Lorena about this property
                  </p>
                  <ContactForm
                    minimal={true}
                    propertyContext={{
                      address: property.address,
                      mlsNumber: property.mlsNumber,
                      price: property.price,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Screen Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 transition-colors rounded-full z-10"
          >
            <X size={24} className="text-white" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 transition-colors rounded-full z-10"
          >
            <ChevronLeft size={32} className="text-white" />
          </button>

          <img
            src={property.images[currentImageIndex]}
            alt={`${property.address} - Image ${currentImageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            width={800}
            height={600}
            loading="lazy"
          />

          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 transition-colors rounded-full z-10"
          >
            <ChevronRight size={32} className="text-white" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-lg">
            {currentImageIndex + 1} / {property.images.length}
          </div>
        </div>
      )}

      {/* Similar Listings */}
      {result?.similar && result.similar.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-playfair text-gold mb-8 text-center">
              Similar Homes Nearby
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.similar.map((sim, _index) => (
                <Link
                  key={sim.id}
                  to={`/property/${sim.id}`}
                  className="group bg-white border border-gray-200 hover:border-gold/50 transition-all duration-300 overflow-hidden hover:shadow-premium"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={sim.images[0] || '/images/properties/home-1.jpg'}
                      alt={sim.address}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      width={800}
                      height={600}
                      loading="lazy"
                    />
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 text-white text-[10px] font-mono">
                      MLS# {sim.mlsNumber}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-xl font-playfair font-bold text-gold mb-1">
                      ${sim.price.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-800 font-medium line-clamp-1">{sim.address}</p>
                    <p className="text-xs text-gray-500 mb-3">{sim.city}, {sim.state} {sim.zip}</p>
                    <div className="flex items-center gap-3 text-gray-700 text-sm border-t border-gray-100 pt-3">
                      <span>{sim.beds} Beds</span>
                      <span>{sim.baths} Baths</span>
                      <span>{sim.sqft.toLocaleString()} sqft</span>
                    </div>
                    {/* GEPAR Rule 18.3.4 + 18.2.12: Listing agent + office required */}
                    <p className="text-sm text-black/50 mt-2">Courtesy of {sim.listOfficeName}</p>
                    <p className="text-sm text-black/50">{sim.listAgentName}</p>
                    <p className="text-xs text-black/40 font-mono mt-0.5">MLS# {sim.mlsNumber}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky Mobile Bottom Bar — CINC killer: instant contact */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t-2 border-gold shadow-2xl">
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          <a
            href={`tel:${PHONE_NUMBER}`}
            className="flex flex-col items-center justify-center py-3 text-gold hover:bg-gold/5 transition-colors touch-target"
          >
            <Phone size={20} />
            <span className="text-[11px] font-lato font-medium mt-1">Call</span>
          </a>
          <a
            href={`sms:${PHONE_NUMBER}?body=${encodeURIComponent(`Hi Lorena, I'm interested in ${property.address} (MLS# ${property.mlsNumber}). Can we schedule a showing?`)}`}
            className="flex flex-col items-center justify-center py-3 text-gold hover:bg-gold/5 transition-colors touch-target"
          >
            <MessageSquare size={20} />
            <span className="text-[11px] font-lato font-medium mt-1">Text</span>
          </a>
          <button
            onClick={() => {
              const contactSection = document.querySelector('#contact-form');
              contactSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-3 text-gold hover:bg-gold/5 transition-colors touch-target"
          >
            <Calendar size={20} />
            <span className="text-[11px] font-lato font-medium mt-1">Schedule</span>
          </button>
        </div>
      </div>

      {/* Soft lead capture after 5th property view */}
      <PropertyViewGate />

      {/* MLS Disclaimer - REQUIRED by GEPAR */}
      <IDXCompliance variant="full" showLogo />

      <Footer />
      {/* Spacer for mobile bottom bar */}
      <div className="h-16 lg:hidden" />
    </div>
  );
};

// Mortgage Calculator Component
const MortgageCalculator = ({ price }: { price: number }) => {
  const [downPayment, setDownPayment] = useState(20);
  const [interestRate, setInterestRate] = useState(7.0);
  const [loanTerm, setLoanTerm] = useState(30);

  const monthlyPayment = useMemo(() => {
    const principal = price * (1 - downPayment / 100);
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;

    if (monthlyRate === 0) return principal / numPayments;

    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    return payment;
  }, [price, downPayment, interestRate, loanTerm]);

  return (
    <div className="bg-gray-50 border border-gold/20 rounded-lg p-6 space-y-6">
      <h3 className="text-xl font-playfair text-gold text-center">Estimated Monthly Payment</h3>

      <div className="text-center">
        <div className="text-4xl font-playfair text-black">${monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div className="text-sm text-black/60 mt-1">per month</div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">
            Down Payment: {downPayment}%
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={downPayment}
            onChange={(e) => setDownPayment(parseInt(e.target.value))}
            className="w-full accent-gold"
            aria-valuemin={0}
            aria-valuemax={50}
            aria-valuenow={downPayment}
            aria-valuetext={`${downPayment}%`}
          />
          <div className="text-sm text-black/60 mt-1">
            ${(price * (downPayment / 100)).toLocaleString()}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">
            Interest Rate: {interestRate}%
          </label>
          <input
            type="range"
            min="3"
            max="10"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(parseFloat(e.target.value))}
            className="w-full accent-gold"
            aria-valuemin={3}
            aria-valuemax={10}
            aria-valuenow={interestRate}
            aria-valuetext={`${interestRate}%`}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">
            Loan Term: {loanTerm} years
          </label>
          <select
            value={loanTerm}
            onChange={(e) => setLoanTerm(parseInt(e.target.value))}
            className="w-full bg-white border border-gray-200 text-black px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
          >
            <option value="15">15 years</option>
            <option value="20">20 years</option>
            <option value="30">30 years</option>
          </select>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
        *This is an estimate. Actual payment may vary based on taxes, insurance, and HOA fees.
      </div>
    </div>
  );
};

export default PropertyDetail;
