import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactForm from '../components/ContactForm';
import { PROPERTIES } from '../constants';
import {
  Bed, Bath, Maximize, MapPin, Calendar, Home, Heart, Share2,
  ChevronLeft, ChevronRight, X, Calculator, TrendingUp, Building
} from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const property = PROPERTIES.find(p => p.id === id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  if (!property) {
    return (
      <div className="bg-blackmin-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-sans text-gold mb-4">Property Not Found</h1>
          <Link to="/properties" className="text-white hover:text-gold">
            ← Back to Properties
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
    <div className="bg-blackmin-h-screen">
      <Navbar />

      {/* Image Gallery */}
      <section className="relative pt-20">
        <div className="relative h-[70vh] bg-gray-100">
          <img
            src={property.images[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover cursor-pointer"
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-dark/80 text-black text-sm rounded-full">
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
          <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
            <div className="flex gap-2 overflow-x-auto pb-4">
              {property.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-24 h-24 rounded overflow-hidden border-2 transition-all ${
                    index === currentImageIndex ? 'border-gold' : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className="animate-fade-in-up">
                <Link to="/properties" className="text-gold hover:text-white flex items-center gap-2 mb-4">
                  <ChevronLeft size={16} />
                  Back to Properties
                </Link>

                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="font-sans text-4xl md:text-5xl text-white">
                    {property.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2 text-black/60 mb-6">
                  <MapPin size={18} className="text-gold" />
                  <span className="text-lg">{property.address}, {property.neighborhood}</span>
                </div>

                <div className="text-5xl font-sans text-gold mb-6">
                  ${property.price.toLocaleString()}
                </div>

                {/* Key Stats */}
                <div className="flex flex-wrap gap-6 pb-6 border-b border-gray-200">
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
                <h2 className="text-2xl font-sans text-gold mb-4">Property Description</h2>
                <p className="text-black/80 leading-relaxed text-lg">
                  {property.description}
                </p>
              </div>

              {/* Features */}
              <div className="animate-fade-in-up delay-200">
                <h2 className="text-2xl font-sans text-gold mb-4">Property Features</h2>
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

              {/* Property Details */}
              <div className="animate-fade-in-up delay-300">
                <h2 className="text-2xl font-sans text-gold mb-4">Property Details</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="border-b border-gray-200 pb-4">
                      <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Property Type</div>
                      <div className="text-white">{property.propertyType}</div>
                    </div>
                    <div className="border-b border-gray-200 pb-4">
                      <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Year Built</div>
                      <div className="text-white">{property.yearBuilt}</div>
                    </div>
                    <div className="border-b border-gray-200 pb-4">
                      <div className="text-xs text-black/60 uppercase tracking-wider mb-1">Days on Market</div>
                      <div className="text-white">{property.daysOnMarket} days</div>
                    </div>
                    {property.mlsNumber && (
                      <div className="border-b border-gray-200 pb-4">
                        <div className="text-xs text-black/60 uppercase tracking-wider mb-1">MLS Number</div>
                        <div className="text-white">{property.mlsNumber}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mortgage Calculator Button */}
              <div className="animate-fade-in-up delay-400">
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white transition-colors"
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
            <div className="lg:col-span-1">
              <div className="sticky top-24 animate-fade-in-up delay-500">
                <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-2xl">
                  <h3 className="font-sans text-2xl text-center text-white mb-2">
                    Schedule a Showing
                  </h3>
                  <p className="text-black/60 text-center text-sm mb-6">
                    Contact Lorena about this property
                  </p>
                  <ContactForm minimal={true} />
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
            alt={property.title}
            className="max-w-full max-h-full object-contain"
          />

          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 transition-colors rounded-full z-10"
          >
            <ChevronRight size={32} className="text-white" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-black text-lg">
            {currentImageIndex + 1} / {property.images.length}
          </div>
        </div>
      )}

      <Footer />
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
    <div className="bg-white border border-gold/20 rounded-lg p-6 space-y-6">
      <h3 className="text-xl font-sans text-gold text-center">Estimated Monthly Payment</h3>

      <div className="text-center">
        <div className="text-4xl font-sans text-white">${monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
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
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-black/60 mb-2">
            Loan Term: {loanTerm} years
          </label>
          <select
            value={loanTerm}
            onChange={(e) => setLoanTerm(parseInt(e.target.value))}
            className="w-full bg-blackborder border-gray-200 text-white px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded"
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
