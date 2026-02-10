import React from 'react';
import { COMPANY_NAME, REALTOR_NAME, ADDRESS, PHONE_NUMBER, EMAIL_ADDRESS, BROKERAGE } from '../constants';
import { Instagram, Linkedin, Facebook, Video, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-24 md:pt-32 pb-10 border-t border-white/10" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand Info */}
          <div>
            <h2 className="font-sans text-2xl font-black text-white mb-2">CASAS EN <span className="text-gold">EL PASO</span></h2>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-4 font-medium">{REALTOR_NAME}</p>

            {/* The Right Move Logo */}
            <div className="mb-6">
              <img
                src="/images/right-move-logo.png"
                alt="The Right Move Real Estate Group"
                className="h-12 w-auto opacity-90"
                loading="lazy"
                onError={(e) => {
                  // Hide if logo not found
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <p className="text-white/70 text-sm leading-relaxed mb-6 font-light">
              Helping families on both sides of the border build wealth through real estate. Bilingual, professional, and dedicated to your future.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gold hover:text-white transition-premium" aria-label="Follow us on Instagram">
                <Instagram size={20} aria-hidden="true" />
              </a>
              <a href="#" className="text-gold hover:text-white transition-premium" aria-label="Follow us on Facebook">
                <Facebook size={20} aria-hidden="true" />
              </a>
              <a href="#" className="text-gold hover:text-white transition-premium" aria-label="Connect on LinkedIn">
                <Linkedin size={20} aria-hidden="true" />
              </a>
              <a href="#" className="text-gold hover:text-white transition-premium" aria-label="Watch our videos">
                <Video size={20} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gold text-xs uppercase tracking-widest font-extrabold mb-6">Navigation</h3>
            <ul className="space-y-4 text-sm text-white/70 font-light">
              <li><a href="/" className="hover:text-gold transition-premium">Home</a></li>
              <li><a href="#about" className="hover:text-gold transition-premium">About Lorena</a></li>
              <li><a href="#services" className="hover:text-gold transition-premium">Services</a></li>
              <li><a href="#neighborhoods" className="hover:text-gold transition-premium">Neighborhood Guide</a></li>
              <li><a href="#contact" className="hover:text-gold transition-premium">Contact</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gold text-xs uppercase tracking-widest font-extrabold mb-6">Contact</h3>
            <ul className="space-y-4 text-sm text-white/70 font-light">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-gold mt-1 shrink-0" aria-hidden="true" />
                <span>{ADDRESS}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-gold shrink-0" aria-hidden="true" />
                <a href={`tel:${PHONE_NUMBER}`} className="hover:text-white transition-premium">{PHONE_NUMBER}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-gold shrink-0" aria-hidden="true" />
                <a href={`mailto:${EMAIL_ADDRESS}`} className="hover:text-white transition-premium">{EMAIL_ADDRESS}</a>
              </li>
            </ul>
          </div>

          {/* Legal / Brokerage */}
          <div>
            <h3 className="text-gold text-xs uppercase tracking-widest font-extrabold mb-6">Professional</h3>
            <div className="mb-4">
              <div className="text-white font-bold mb-2">{BROKERAGE}</div>
              <div className="text-white/70 text-sm font-light">Licensed Real Estate Professional</div>
            </div>
            <div className="text-xs text-white/50 space-y-2 font-light">
              <p>Equal Housing Opportunity.</p>
              <p>Each office is independently owned and operated.</p>
              <div className="flex flex-col space-y-1 mt-4">
                <a href="#" className="underline hover:text-gold transition-premium">TREC Consumer Protection Notice</a>
                <a href="#" className="underline hover:text-gold transition-premium">TREC Information About Brokerage Services</a>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-white/50 font-light">
          <p>&copy; 2026 {COMPANY_NAME}. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Designed for Excellence.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;