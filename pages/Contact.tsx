import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { REALTOR_NAME, PHONE_NUMBER, EMAIL_ADDRESS, ADDRESS, BROKERAGE, OFFICE_NUMBER } from '../constants';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactForm from '../components/ContactForm';
import { useTranslation } from '../lib/i18n';

const Contact = () => {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Contact Lorena Ontiveros-Ortega',
    description: 'Get in touch with Lorena for buying, selling, or military relocation help in El Paso. Bilingual service — hablamos espanol. Call 915-487-5581.',
    canonicalUrl: 'https://casasenelpasotx.com/contact',
    jsonLd: {
      '@type': 'ContactPage',
      name: 'Contact Lorena Ontiveros-Ortega',
      url: 'https://casasenelpasotx.com/contact',
    },
  });

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-black overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 text-center">
          <span className="text-gold text-xs uppercase tracking-[0.3em] font-lato font-semibold">
            {t('contact.heroSubtitle')}
          </span>
          <h1 className="mt-4 font-playfair text-4xl md:text-5xl lg:text-6xl text-white">
            {t('contact.heroTitle')}
          </h1>
          <p className="mt-6 text-white/70 text-lg md:text-xl max-w-2xl mx-auto font-lato font-light leading-relaxed">
            {t('contact.heroDescription')}
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

            {/* Left Column: Contact Form (wider) */}
            <div className="lg:col-span-3">
              <h2 className="font-playfair text-3xl md:text-4xl text-black mb-2">
                {t('contact.sendMessage')}
              </h2>
              <p className="text-black/60 font-lato mb-8">
                {t('contact.formDescription')}
              </p>
              <div className="bg-white border-2 border-gray-200 p-6 md:p-10">
                <ContactForm />
              </div>
            </div>

            {/* Right Column: Contact Info Cards */}
            <div className="lg:col-span-2 space-y-6">

              {/* Phone */}
              <div className="border-2 border-gray-200 p-6 hover:border-gold transition-premium group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold/10 flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-lg text-black mb-1">{t('contact.phone')}</h3>
                    <a
                      href={`tel:${PHONE_NUMBER}`}
                      className="text-black/70 font-lato hover:text-gold transition-premium block"
                    >
                      {PHONE_NUMBER}
                    </a>
                  </div>
                </div>
              </div>

              {/* Office */}
              <div className="border-2 border-gray-200 p-6 hover:border-gold transition-premium group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold/10 flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-lg text-black mb-1">{t('contact.office')}</h3>
                    <a
                      href={`tel:${OFFICE_NUMBER}`}
                      className="text-black/70 font-lato hover:text-gold transition-premium block"
                    >
                      {OFFICE_NUMBER}
                    </a>
                    <p className="text-black/50 text-sm font-lato mt-1">{BROKERAGE}</p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="border-2 border-gray-200 p-6 hover:border-gold transition-premium group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold/10 flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-lg text-black mb-1">{t('contact.email')}</h3>
                    <a
                      href={`mailto:${EMAIL_ADDRESS}`}
                      className="text-black/70 font-lato hover:text-gold transition-premium block break-all"
                    >
                      {EMAIL_ADDRESS}
                    </a>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-2 border-gray-200 p-6 hover:border-gold transition-premium group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold/10 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-lg text-black mb-1">{t('contact.address')}</h3>
                    <p className="text-black/70 font-lato leading-relaxed">{ADDRESS}</p>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="border-2 border-gray-200 p-6 hover:border-gold transition-premium group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold/10 flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-lg text-black mb-1">{t('contact.hours')}</h3>
                    <ul className="text-black/70 font-lato text-sm space-y-1">
                      <li className="flex justify-between gap-4">
                        <span>{t('contact.monFri')}</span>
                        <span className="font-semibold">9:00 AM – 6:00 PM</span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span>{t('contact.saturday')}</span>
                        <span className="font-semibold">10:00 AM – 4:00 PM</span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span>{t('contact.sunday')}</span>
                        <span className="font-semibold">{t('contact.byAppointment')}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Hablo Español Trust Badge */}
              <div className="border-2 border-gold bg-gold/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold/20 flex items-center justify-center shrink-0">
                    <MessageCircle size={20} className="text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-lg text-black mb-1">Hablo Español</h3>
                    <p className="text-black/70 font-lato text-sm leading-relaxed">
                      {t('contact.bilingualDesc')}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals Bar */}
      <section className="bg-black py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={22} className="text-gold" aria-hidden="true" />
              </div>
              <h3 className="font-playfair text-lg text-white mb-1">{t('contact.trustBilingual')}</h3>
              <p className="text-white/60 font-lato text-sm">
                {t('contact.trustBilingualDesc')}
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <Clock size={22} className="text-gold" aria-hidden="true" />
              </div>
              <h3 className="font-playfair text-lg text-white mb-1">{t('contact.trustResponse')}</h3>
              <p className="text-white/60 font-lato text-sm">
                {t('contact.trustResponseDesc')}
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <MapPin size={22} className="text-gold" aria-hidden="true" />
              </div>
              <h3 className="font-playfair text-lg text-white mb-1">{t('contact.trustLicensed')}</h3>
              <p className="text-white/60 font-lato text-sm">
                {t('contact.trustLicensedDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
