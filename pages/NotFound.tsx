import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTranslation } from '../lib/i18n';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const NotFound = () => {
  const { t } = useTranslation();
  usePageTitle(t('notFound.title'));
  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <main className="flex items-center justify-center min-h-[70vh] px-6">
        <div className="text-center max-w-lg">
          <p className="text-gold text-8xl sm:text-9xl font-playfair font-bold mb-4">404</p>
          <h1 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-black font-bold mb-4">
            {t('notFound.title')}
          </h1>
          <p className="text-black/60 font-light text-lg mb-8 leading-relaxed">
            {t('notFound.message')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold text-dark font-lato font-bold uppercase tracking-widest hover:shadow-gold-glow transition-premium rounded"
            >
              <Home size={16} />
              {t('notFound.backHome')}
            </Link>
            <Link
              to="/properties"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gold text-gold font-lato font-bold uppercase tracking-widest hover:bg-gold hover:text-white transition-premium rounded"
            >
              <ArrowLeft size={16} />
              {t('notFound.searchHomes')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
