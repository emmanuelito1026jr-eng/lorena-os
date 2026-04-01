import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { NEIGHBORHOODS_DETAIL, REALTOR_NAME } from '../constants';
import { MapPin, DollarSign, Users, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

const Neighborhoods = () => {
  usePageMeta({
    title: 'El Paso Neighborhoods Guide',
    description: 'Explore El Paso neighborhoods — Westside, Northeast, Upper Valley, Horizon City, Central & Eastlake. Median prices, schools, amenities & lifestyle info.',
    canonicalUrl: 'https://casasenelpasotx.com/neighborhoods',
  });

  const allPrices = NEIGHBORHOODS_DETAIL.flatMap(n => n.priceRange);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);

  return (
    <div className="bg-warm-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-dark pt-32 pb-20 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-100 to-dark opacity-95" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-gold blur-[120px]" />
          <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-gold blur-[100px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <MapPin className="w-4 h-4 text-gold" />
            <span className="font-lato text-sm text-gold tracking-wide uppercase">
              Your Guide to El Paso Living
            </span>
          </div>
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            Explore El Paso{' '}
            <span className="text-gold">Neighborhoods</span>
          </h1>
          <p className="font-lato text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            From historic charm downtown to luxury mountain views on the Westside, 
            discover the neighborhood that fits your lifestyle and budget.
          </p>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-lato text-2xl font-bold text-dark">{NEIGHBORHOODS_DETAIL.length}</p>
                <p className="font-lato text-sm text-gray-500">Neighborhoods</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-lato text-2xl font-bold text-dark">
                  {formatCurrency(minPrice)}&ndash;{formatCurrency(maxPrice)}
                </p>
                <p className="font-lato text-sm text-gray-500">Price Range</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-lato text-2xl font-bold text-dark">
                  {(NEIGHBORHOODS_DETAIL.reduce((sum, n) => sum + n.demographics.population, 0) / 1000).toFixed(0)}K+
                </p>
                <p className="font-lato text-sm text-gray-500">Residents</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhood Cards Grid */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <h2 className="font-playfair text-3xl md:text-4xl text-dark mb-4">
              Find Your Perfect Neighborhood
            </h2>
            <p className="font-lato text-gray-500 max-w-xl mx-auto">
              Each El Paso neighborhood has its own character. Explore the details 
              to find the community where you belong.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {NEIGHBORHOODS_DETAIL.map((neighborhood) => (
              <Link
                key={neighborhood.id}
                to={`/neighborhood/${neighborhood.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Card Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={neighborhood.image}
                    alt={`${neighborhood.name} neighborhood in El Paso`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-playfair text-xl text-white mb-1">
                      {neighborhood.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-gold" />
                      <span className="font-lato text-sm font-semibold text-gold">
                        {formatFullCurrency(neighborhood.medianPrice)}
                      </span>
                      <span className="font-lato text-xs text-white/60 ml-1">
                        median
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <p className="font-lato text-sm text-gray-600 leading-relaxed mb-4">
                    {neighborhood.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-lato text-xs text-gray-500">
                        {neighborhood.demographics.homeownership}% homeownership
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gold font-lato text-sm font-semibold group-hover:gap-2 transition-all duration-300">
                      Explore
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-dark">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-playfair text-3xl md:text-4xl text-white mb-4">
            Not Sure Which Neighborhood?
          </h2>
          <p className="font-lato text-white/60 max-w-lg mx-auto mb-8 leading-relaxed">
            As an El Paso native, {REALTOR_NAME} can help you find the perfect
            neighborhood based on your lifestyle, budget, and family needs.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-dark font-lato font-semibold px-8 py-3.5 rounded-lg transition-colors duration-300"
          >
            Let&apos;s Talk Neighborhoods
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Neighborhoods;
