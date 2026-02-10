import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Landing from './pages/Landing';
import ErrorBoundary from './components/ErrorBoundary';

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
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/landing" element={<Landing />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;