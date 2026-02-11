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
            {/* The Right Move Logo */}
            <div className="mb-6">
              <img
                src="/images/logo/right_move.png"
                alt="The Right Move Real Estate Group"
                className="h-16 w-auto"
                loading="lazy"
              />
            </div>

            <p className="text-xs uppercase tracking-widest text-white/60 mb-4 font-lato font-medium">{REALTOR_NAME}</p>

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
            <h3 className="text-gold text-xs uppercase tracking-widest font-extrabold mb-6 font-lato">Professional</h3>
            <div className="mb-4">
              <div className="text-white font-bold mb-2 font-lato">{BROKERAGE}</div>
              <div className="text-white/70 text-sm font-lato font-light">Licensed Real Estate Professional</div>
            </div>

            {/* Equal Housing Logo */}
            <div className="mb-4">
              <img
                src="/images/logo/equal-housing-opportunity.jpg"
                alt="Equal Housing Opportunity"
                className="h-16 w-16"
                loading="lazy"
              />
            </div>

            <div className="text-xs text-white/50 space-y-2 font-lato font-light">
              <p>Equal Housing Opportunity.</p>
              <p>Each office is independently owned and operated.</p>
            </div>
          </div>

        </div>

        {/* MLS Disclaimer */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="mb-4">
            <img
              src="/images/logo/greater-el-paso-realtors.jpg"
              alt="Greater El Paso Association of REALTORS®"
              className="h-12 w-auto mb-4"
              loading="lazy"
            />
          </div>
          <p className="text-xs text-white/60 font-lato leading-relaxed">
            Based on information from the Greater El Paso Association of REALTORS® IDX information is provided exclusively for consumers' personal, non-commercial use, and may not be used for any purpose other than to identify prospective properties consumers may be interested in purchasing. Information Is Believed To Be Accurate But Not Guaranteed. Copyright 2026 Greater El Paso Association of Realtors Multiple Listing Service. All Rights Reserved.
          </p>
        </div>

        {/* Legal Links */}
        <div className="border-t border-white/10 pt-6 mb-6">
          <div className="flex flex-wrap gap-4 text-sm text-white/70 font-lato">
            <a href="/terms" className="hover:text-gold transition-premium">Terms of Use</a>
            <span className="text-white/30">|</span>
            <a href="/privacy" className="hover:text-gold transition-premium">Privacy Notice</a>
            <span className="text-white/30">|</span>
            <a href="/dmca" className="hover:text-gold transition-premium">DMCA</a>
            <span className="text-white/30">|</span>
            <a href="/documents/trec-iabs.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-premium">
              Texas Real Estate Commission Information About Brokerage Services
            </a>
            <span className="text-white/30">|</span>
            <a href="https://www.trec.texas.gov/sites/default/files/pdf-forms/CN%201-4-1.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-premium">
              Texas Real Estate Commission Consumer Protection Notice
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white/50 font-lato">&copy; 2026 The Right Move Real Estate Group. All rights reserved.</p>
          <p className="text-xs text-white/40 font-lato mt-2">Lorena Ontiveros-Ortega | 10420 Montwood Dr., Ste N-163, El Paso, TX 79935 | 915-487-5581</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;