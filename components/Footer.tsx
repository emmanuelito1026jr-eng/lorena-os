import React from 'react';
import { COMPANY_NAME, REALTOR_NAME, ADDRESS, PHONE_NUMBER, EMAIL_ADDRESS, BROKERAGE } from '../constants';
import { Instagram, Linkedin, Facebook, Video, MapPin, Phone, Mail } from 'lucide-react';

const Footer  = () => {
  return (
    <footer className="bg-black text-white pt-20 pb-10 border-t border-gold/20" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Info */}
          <div>
            <h2 className="font-serif text-2xl font-bold text-ivory mb-2">CASAS EN <span className="text-gold">EL PASO</span></h2>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-6">{REALTOR_NAME}</p>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Helping families on both sides of the border build wealth through real estate. Bilingual, professional, and dedicated to your future.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gold hover:text-white transition-colors" aria-label="Follow us on Instagram">
                <Instagram size={20} aria-hidden="true" />
              </a>
              <a href="#" className="text-gold hover:text-white transition-colors" aria-label="Follow us on Facebook">
                <Facebook size={20} aria-hidden="true" />
              </a>
              <a href="#" className="text-gold hover:text-white transition-colors" aria-label="Connect on LinkedIn">
                <Linkedin size={20} aria-hidden="true" />
              </a>
              <a href="#" className="text-gold hover:text-white transition-colors" aria-label="Watch our videos">
                <Video size={20} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gold text-xs uppercase tracking-widest font-bold mb-6">Navigation</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-gold transition-colors">About Lorena</a></li>
              <li><a href="#services" className="hover:text-gold transition-colors">Services</a></li>
              <li><a href="#neighborhoods" className="hover:text-gold transition-colors">Neighborhood Guide</a></li>
              <li><a href="#contact" className="hover:text-gold transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gold text-xs uppercase tracking-widest font-bold mb-6">Contact</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-gold mt-1 shrink-0" aria-hidden="true" />
                <span>{ADDRESS}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-gold shrink-0" aria-hidden="true" />
                <a href={`tel:${PHONE_NUMBER}`} className="hover:text-white">{PHONE_NUMBER}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-gold shrink-0" aria-hidden="true" />
                <a href={`mailto:${EMAIL_ADDRESS}`} className="hover:text-white">{EMAIL_ADDRESS}</a>
              </li>
            </ul>
          </div>

          {/* Legal / Brokerage */}
          <div>
            <h3 className="text-gold text-xs uppercase tracking-widest font-bold mb-6">Professional</h3>
            <div className="mb-4">
              <div className="text-ivory font-semibold mb-2">{BROKERAGE}</div>
              <div className="text-gray-400 text-sm">Licensed Real Estate Professional</div>
            </div>
            <div className="text-xs text-gray-500 space-y-2">
              <p>Equal Housing Opportunity.</p>
              <p>Each office is independently owned and operated.</p>
              <div className="flex flex-col space-y-1 mt-4">
                <a href="#" className="underline hover:text-gold">TREC Consumer Protection Notice</a>
                <a href="#" className="underline hover:text-gold">TREC Information About Brokerage Services</a>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
          <p>&copy; 2026 {COMPANY_NAME}. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Designed for Excellence.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;