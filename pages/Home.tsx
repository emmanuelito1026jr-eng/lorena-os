import { usePageMeta } from '../hooks/usePageMeta';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedListings from '../components/FeaturedListings';
import WhyLorena from '../components/WhyLorena';
import ServicesTabbed from '../components/ServicesTabbed';
import NeighborhoodGuide from '../components/NeighborhoodGuide';
import MarketSnapshot from '../components/MarketSnapshot';
import Testimonials from '../components/Testimonials';
import LeadCaptureSection from '../components/LeadCaptureSection';
import CTABanner from '../components/CTABanner';
import IDXCompliance from '../components/mls/IDXCompliance';
import Footer from '../components/Footer';

const Home = () => {
  usePageMeta({
    title: 'El Paso Homes for Sale',
    description: 'Find your dream home in El Paso with Lorena Ontiveros-Ortega. Bilingual real estate expert specializing in buying, selling, and military/VA home loans near Fort Bliss.',
    canonicalUrl: 'https://casasenelpasotx.com/',
    jsonLd: {
      '@type': 'RealEstateAgent',
      name: 'Lorena Ontiveros-Ortega',
      url: 'https://casasenelpasotx.com',
      telephone: '+1-915-487-5581',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '10420 Montwood Dr., Ste N-163',
        addressLocality: 'El Paso',
        addressRegion: 'TX',
        postalCode: '79935',
        addressCountry: 'US',
      },
      areaServed: 'El Paso, TX',
      knowsLanguage: ['en', 'es'],
    },
  });
  return (
    <div className="bg-white min-h-screen">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <div id="featured">
          <FeaturedListings />
        </div>
        <WhyLorena />
        <ServicesTabbed />
        <NeighborhoodGuide />
        <MarketSnapshot />
        <Testimonials />
        <LeadCaptureSection />
        <CTABanner />
      </main>
      {/* MLS Disclaimer - REQUIRED by GEPAR on pages showing listing data */}
      <IDXCompliance variant="full" showLogo />
      <Footer />
    </div>
  );
};

export default Home;
