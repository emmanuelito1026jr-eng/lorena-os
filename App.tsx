import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { useLenis } from './hooks/useLenis';

// Lazy-loaded routes for code splitting
const Home = React.lazy(() => import('./pages/Home'));
const Landing = React.lazy(() => import('./pages/Landing'));
const Properties = React.lazy(() => import('./pages/Properties'));
const PropertyDetail = React.lazy(() => import('./pages/PropertyDetail'));
const About = React.lazy(() => import('./pages/About'));
const NeighborhoodDetail = React.lazy(() => import('./pages/NeighborhoodDetail'));
const ServiceDetail = React.lazy(() => import('./pages/ServiceDetail'));
const AmericanPacificMortgage = React.lazy(() => import('./pages/AmericanPacificMortgage'));
const HomeEstimate = React.lazy(() => import('./pages/HomeEstimate'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const DMCA = React.lazy(() => import('./pages/DMCA'));

// ScrollToTop component to handle scroll behavior on navigation
const ScrollToTop = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location.hash) {
      // Handle hash-based navigation (e.g., #contact, #about)
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Scroll to top for route changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return null;
};

const App = () => {
  // Initialize smooth scrolling (desktop only)
  useLenis();

  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/neighborhood/:id" element={<NeighborhoodDetail />} />
          <Route path="/service/:serviceId" element={<ServiceDetail />} />
          <Route path="/mortgage" element={<AmericanPacificMortgage />} />
          <Route path="/estimate" element={<HomeEstimate />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/dmca" element={<DMCA />} />
        </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;