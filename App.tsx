import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useLenis } from './hooks/useLenis';

const DashboardLayout = React.lazy(() => import('./components/dashboard/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const PortalRoute = React.lazy(() => import('./components/portal/PortalRoute').then(m => ({ default: m.PortalRoute })));
const PortalLayout = React.lazy(() => import('./components/portal/PortalLayout').then(m => ({ default: m.PortalLayout })));
const StickyMobileCTA = React.lazy(() => import('./components/lead-capture/StickyMobileCTA'));
const ExitIntentPopup = React.lazy(() => import('./components/lead-capture/ExitIntentPopup'));
const FloatingChatButton = React.lazy(() => import('./components/lead-capture/FloatingChatButton'));
import { LanguageProvider } from './lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2, retry: 1 } },
});

const Home = React.lazy(() => import('./pages/Home'));
const Landing = React.lazy(() => import('./pages/Landing'));
const Properties = React.lazy(() => import('./pages/Properties'));
const PropertyDetail = React.lazy(() => import('./pages/PropertyDetail'));
const About = React.lazy(() => import('./pages/About'));
const Neighborhoods = React.lazy(() => import('./pages/Neighborhoods'));
const NeighborhoodDetail = React.lazy(() => import('./pages/NeighborhoodDetail'));
const ServiceDetail = React.lazy(() => import('./pages/ServiceDetail'));
const AmericanPacificMortgage = React.lazy(() => import('./pages/AmericanPacificMortgage'));
const HomeEstimate = React.lazy(() => import('./pages/HomeEstimate'));
const Sellers = React.lazy(() => import('./pages/Sellers'));
const MilitaryPage = React.lazy(() => import('./pages/MilitaryPage'));
const Contact = React.lazy(() => import('./pages/Contact'));
const BlogHub = React.lazy(() => import('./pages/BlogHub'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const DMCA = React.lazy(() => import('./pages/DMCA'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const PortalLogin = React.lazy(() => import('./pages/portal/PortalLogin'));
const PortalHome = React.lazy(() => import('./pages/portal/PortalHome'));
const PropertySearch = React.lazy(() => import('./pages/portal/PropertySearch'));
const SavedHomes = React.lazy(() => import('./pages/portal/SavedHomes'));
const TransactionTracker = React.lazy(() => import('./pages/portal/TransactionTracker'));
const ClientMessages = React.lazy(() => import('./pages/portal/ClientMessages'));
const MyShowings = React.lazy(() => import('./pages/portal/MyShowings'));
const HomeValueEstimate = React.lazy(() => import('./pages/portal/HomeValueEstimate'));
const MortgageCalculator = React.lazy(() => import('./pages/portal/MortgageCalculator'));
const ClientProfile = React.lazy(() => import('./pages/portal/ClientProfile'));
const DashboardHome = React.lazy(() => import('./pages/dashboard/DashboardHome'));
const Leads = React.lazy(() => import('./pages/dashboard/Leads'));
const LeadDetail = React.lazy(() => import('./pages/dashboard/LeadDetail'));
const Deals = React.lazy(() => import('./pages/dashboard/Deals'));
const Messages = React.lazy(() => import('./pages/dashboard/Messages'));
const Showings = React.lazy(() => import('./pages/dashboard/Showings'));
const Market = React.lazy(() => import('./pages/dashboard/Market'));
const CMA = React.lazy(() => import('./pages/dashboard/CMA'));
const AutoTracks = React.lazy(() => import('./pages/dashboard/AutoTracks'));
const Analytics = React.lazy(() => import('./pages/dashboard/Analytics'));
const DashboardSettings = React.lazy(() => import('./pages/dashboard/DashboardSettings'));
const AITeam = React.lazy(() => import('./pages/dashboard/AITeam'));
const MilitaryPipeline = React.lazy(() => import('./pages/dashboard/Military'));
const ValorPage = React.lazy(() => import('./pages/valor'));
const OpenHousePage = React.lazy(() => import('./pages/open-house'));

const ScrollToTop = () => {
  const location = useLocation();
  React.useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);
  return null;
};

const App = () => {
  useLenis();
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="space-y-4 w-72"><div className="h-8 bg-gray-200 rounded animate-pulse" /><div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" /><div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" /></div></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/about/military" element={<MilitaryPage />} />
            <Route path="/neighborhoods" element={<Neighborhoods />} />
            <Route path="/neighborhood/:id" element={<NeighborhoodDetail />} />
            <Route path="/service/:serviceId" element={<ServiceDetail />} />
            <Route path="/mortgage" element={<AmericanPacificMortgage />} />
            <Route path="/estimate" element={<HomeEstimate />} />
            <Route path="/sellers" element={<Sellers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<BlogHub />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/dmca" element={<DMCA />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal" element={<PortalRoute><PortalLayout /></PortalRoute>}>
              <Route index element={<PortalHome />} />
              <Route path="search" element={<PropertySearch />} />
              <Route path="favorites" element={<SavedHomes />} />
              <Route path="transaction" element={<TransactionTracker />} />
              <Route path="messages" element={<ClientMessages />} />
              <Route path="showings" element={<MyShowings />} />
              <Route path="home-value" element={<HomeValueEstimate />} />
              <Route path="calculator" element={<MortgageCalculator />} />
              <Route path="profile" element={<ClientProfile />} />
            </Route>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardHome />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetail />} />
              <Route path="deals" element={<Deals />} />
              <Route path="messages" element={<Messages />} />
              <Route path="showings" element={<Showings />} />
              <Route path="market" element={<Market />} />
              <Route path="cma" element={<CMA />} />
              <Route path="autotracks" element={<AutoTracks />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<DashboardSettings />} />
              <Route path="ai-team" element={<AITeam />} />
              <Route path="military" element={<MilitaryPipeline />} />
            </Route>
            <Route path="/valor" element={<ValorPage />} />
            <Route path="/open-house" element={<OpenHousePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <StickyMobileCTA />
          <ExitIntentPopup />
          <FloatingChatButton />
        </Router>
      </AuthProvider>
      </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;