import { useLocation } from 'react-router-dom';
import { Phone, MessageCircle, Calendar } from 'lucide-react';
import { PHONE_NUMBER } from '../../constants';
import { useTranslation } from '../../lib/i18n';

const HIDDEN_ROUTES = ['/portal', '/dashboard', '/login', '/signup', '/landing'];

const StickyMobileCTA = () => {
  const location = useLocation();
  const { t } = useTranslation();

  // Hide on dashboard, auth, and landing routes
  if (HIDDEN_ROUTES.some((route) => location.pathname.startsWith(route))) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gold shadow-[0_-4px_20px_rgba(0,0,0,0.15)] safe-area-bottom">
      <div className="grid grid-cols-3 divide-x divide-gold-dark">
        <a
          href={`tel:${PHONE_NUMBER}`}
          className="flex flex-col items-center justify-center py-3 text-white hover:bg-gold-dark transition-colors touch-target"
          aria-label="Call Lorena"
        >
          <Phone size={20} />
          <span className="text-[10px] font-lato font-bold uppercase tracking-wider mt-1">{t('mobileCta.call')}</span>
        </a>
        <a
          href={`sms:${PHONE_NUMBER}`}
          className="flex flex-col items-center justify-center py-3 text-white hover:bg-gold-dark transition-colors touch-target"
          aria-label="Text Lorena"
        >
          <MessageCircle size={20} />
          <span className="text-[10px] font-lato font-bold uppercase tracking-wider mt-1">{t('mobileCta.text')}</span>
        </a>
        <a
          href="/contact"
          className="flex flex-col items-center justify-center py-3 text-white hover:bg-gold-dark transition-colors touch-target"
          aria-label="Schedule a consultation"
        >
          <Calendar size={20} />
          <span className="text-[10px] font-lato font-bold uppercase tracking-wider mt-1">{t('mobileCta.consult')}</span>
        </a>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
