import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactForm from '../components/ContactForm';
import {
  PARTNER_NAME,
  PARTNER_TITLE,
  PARTNER_COMPANY,
  PARTNER_PHONE,
  PARTNER_EMAIL,
  PARTNER_WEBSITE,
  PARTNER_NMLS,
  PARTNER_ADDRESS
} from '../constants';
import { Phone, Mail, Globe, MapPin, Award, TrendingUp, Shield, Home } from 'lucide-react';
import { staggerReveal } from '../utils/animations';

const AmericanPacificMortgage = () => {
  useEffect(() => {
    staggerReveal('.service-card', 0.15);
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-br from-dark to-dark-100">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-gold mb-6">
            American Pacific Mortgage
          </h1>
          <p className="font-lato text-lg md:text-xl text-warm-white max-w-2xl mx-auto mb-8">
            Your trusted mortgage partner in El Paso, Texas. Expert guidance from application to closing.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href={`tel:${PARTNER_PHONE}`}
              className="px-8 py-4 bg-gold text-dark font-lato font-bold uppercase tracking-widest hover:shadow-gold-glow transition-premium"
            >
              Call Now
            </a>
            <a
              href="#contact"
              className="px-8 py-4 border-2 border-gold text-gold font-lato font-bold uppercase tracking-widest hover:bg-gold hover:text-dark transition-premium"
            >
              Get Pre-Approved
            </a>
          </div>
        </div>
      </section>

      {/* Emmanuel's Info */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Photo */}
            <div className="aspect-[16/9] overflow-hidden rounded-lg shadow-premium">
              <img
                src="/images/emmanuel-professional.jpg"
                alt={`${PARTNER_NAME}, ${PARTNER_TITLE}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Info */}
            <div>
              <h2 className="font-playfair text-4xl md:text-5xl text-dark mb-4">
                Meet {PARTNER_NAME}
              </h2>
              <p className="text-gold text-sm uppercase tracking-widest mb-6 font-lato font-bold">
                {PARTNER_TITLE}
              </p>
              <p className="font-lato text-dark/80 text-lg mb-6 leading-relaxed">
                With years of experience in mortgage lending, Emmanuel specializes in helping El Paso families achieve homeownership. His bilingual expertise and deep understanding of the local market make the mortgage process smooth and stress-free.
              </p>

              {/* Contact Info */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Phone className="text-gold" size={20} />
                  <a href={`tel:${PARTNER_PHONE}`} className="font-lato text-dark hover:text-gold transition-premium">
                    {PARTNER_PHONE}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-gold" size={20} />
                  <a href={`mailto:${PARTNER_EMAIL}`} className="font-lato text-dark hover:text-gold transition-premium">
                    {PARTNER_EMAIL}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="text-gold" size={20} />
                  <a href={`https://${PARTNER_WEBSITE}`} target="_blank" rel="noopener noreferrer" className="font-lato text-dark hover:text-gold transition-premium">
                    {PARTNER_WEBSITE}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="text-gold" size={20} />
                  <span className="font-lato text-dark/80">{PARTNER_ADDRESS}</span>
                </div>
              </div>

              <p className="text-dark/60 text-sm font-lato">{PARTNER_NMLS}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mortgage Services */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-playfair text-4xl md:text-5xl text-dark text-center mb-16">
            Mortgage Solutions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Home, title: 'Home Purchase', description: 'Competitive rates for first-time buyers and move-up buyers' },
              { icon: TrendingUp, title: 'Refinancing', description: 'Lower your rate or access your home equity' },
              { icon: Award, title: 'VA & FHA Loans', description: 'Specialized programs for veterans and first-time buyers' },
              { icon: Shield, title: 'Pre-Approval', description: 'Get approved before you start shopping' }
            ].map((service, index) => (
              <div key={index} className="service-card bg-white p-8 rounded-lg shadow-premium hover:shadow-gold-glow transition-premium">
                <service.icon className="text-gold mb-4" size={40} />
                <h3 className="font-playfair text-xl text-dark mb-3">{service.title}</h3>
                <p className="font-lato text-dark/70 text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-playfair text-4xl md:text-5xl text-dark text-center mb-6">
            Get Pre-Approved Today
          </h2>
          <p className="font-lato text-dark/70 text-center mb-12 max-w-2xl mx-auto">
            Start your journey to homeownership. Fill out the form below and Emmanuel will contact you within 24 hours.
          </p>
          <ContactForm />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AmericanPacificMortgage;
