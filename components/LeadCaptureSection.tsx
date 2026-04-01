import { Phone } from 'lucide-react';
import { PHONE_NUMBER } from '../constants';
import { useTranslation } from '../lib/i18n';
import ContactForm from './ContactForm';

const LeadCaptureSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 md:py-28 bg-gold relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-10">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4">
            {t('leadCapture.headline')}
          </h2>
          <p className="font-lato text-white/90 text-lg max-w-2xl mx-auto">
            {t('leadCapture.description')}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-premium-lg">
          <ContactForm minimal />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-white">
          <a
            href={`tel:${PHONE_NUMBER}`}
            className="flex items-center gap-2 font-lato font-semibold hover:text-white/80 transition-all"
          >
            <Phone size={16} />
            {t('leadCapture.callDirectly')} {PHONE_NUMBER}
          </a>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="font-lato font-medium">{t('leadCapture.habloEspanol')}</span>
        </div>
      </div>
    </section>
  );
};

export default LeadCaptureSection;
