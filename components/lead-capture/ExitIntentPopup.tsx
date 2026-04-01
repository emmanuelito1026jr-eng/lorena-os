import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Home, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

const HIDDEN_ROUTES = ['/portal', '/dashboard', '/login', '/signup'];

const ExitIntentPopup = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger when mouse moves to top of page (exit intent)
    if (e.clientY <= 5) {
      const shown = sessionStorage.getItem('exit-intent-shown');
      if (!shown) {
        setIsVisible(true);
        sessionStorage.setItem('exit-intent-shown', '1');
      }
    }
  }, []);

  useEffect(() => {
    // Desktop only — no exit intent on mobile
    if (window.innerWidth < 768) return;

    // Delay listener so it doesn't fire immediately
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);

    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
      if (webhookUrl && !webhookUrl.includes('your-n8n-instance')) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            source: 'exit-intent-popup',
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
          }),
        });
      }
      setSubmitted(true);
      setTimeout(() => setIsVisible(false), 2500);
    } catch {
      setError(t('exitPopup.error'));
    }
  };

  // Hide on dashboard, portal, login, and signup routes
  if (HIDDEN_ROUTES.some((route) => location.pathname.startsWith(route))) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <div className="hidden md:flex fixed inset-0 z-[100] items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in-up">
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-dark transition-colors z-10"
          aria-label="Close popup"
        >
          <X size={20} />
        </button>

        {/* Gold header */}
        <div className="bg-gold px-8 py-6 text-center">
          <Home className="text-white mx-auto mb-3" size={32} />
          <h3 className="font-playfair text-2xl font-bold text-white">
            {t('exitPopup.headline')}
          </h3>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {!submitted ? (
            <>
              <p className="font-lato text-gray-600 text-center mb-6">
                {t('exitPopup.description')}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('exitPopup.emailPlaceholder')}
                  required
                  autoComplete="email"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 font-lato text-dark focus:outline-none focus:border-gold transition-colors"
                />
                <button
                  type="submit"
                  className="w-full bg-gold text-white font-lato font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-gold-dark transition-all flex items-center justify-center gap-2"
                >
                  {t('exitPopup.getListings')}
                  <ArrowRight size={16} />
                </button>
              </form>
              {error && (
                <p className="text-red-600 text-xs text-center mt-2 font-lato">
                  {error}
                </p>
              )}
              <p className="text-[10px] text-gray-400 text-center mt-3 font-lato">
                {t('exitPopup.disclaimer')}
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="font-playfair text-xl font-bold text-dark mb-2">{t('exitPopup.successTitle')}</p>
              <p className="font-lato text-gray-600">{t('exitPopup.successMessage')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
