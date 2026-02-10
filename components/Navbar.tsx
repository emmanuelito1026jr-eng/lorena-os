import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS, PHONE_NUMBER, COMPANY_NAME } from '../constants';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Hide navbar on landing page
  if (location.pathname === '/landing') return null;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus trap and keyboard handlers for mobile menu
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
        return;
      }

      // Tab trap
      if (e.key === 'Tab' && menuRef.current) {
        const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus first element when menu opens
    const firstLink = menuRef.current?.querySelector<HTMLElement>('a[href]');
    firstLink?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-dark/95 backdrop-blur-sm border-b border-gold/20 py-4' : 'bg-transparent py-6'
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex flex-col" aria-label="Casas En El Paso TX Home">
            <span className="font-serif text-2xl font-bold tracking-wider text-ivory">
              CASAS EN <span className="text-gold">EL PASO</span>
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-gray-400">Lorena Ontiveros-Ortega</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm uppercase tracking-widest hover:text-gold transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="flex items-center gap-2 border border-gold text-gold px-4 py-2 rounded-sm hover:bg-gold hover:text-dark transition-all duration-300 uppercase text-xs tracking-widest font-bold"
              aria-label={`Call ${PHONE_NUMBER}`}
            >
              <Phone size={14} aria-hidden="true" />
              {PHONE_NUMBER}
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              ref={buttonRef}
              onClick={() => setIsOpen(!isOpen)}
              className="text-ivory hover:text-gold"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X size={28} aria-hidden="true" /> : <Menu size={28} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="md:hidden bg-dark-card border-t border-gold/20 absolute w-full"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="px-4 pt-2 pb-8 space-y-4 flex flex-col items-center">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-3 py-2 text-base font-medium hover:text-gold uppercase tracking-widest"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="mt-4 flex items-center gap-2 bg-gold text-dark px-6 py-3 rounded-sm font-bold uppercase tracking-widest"
              onClick={() => setIsOpen(false)}
              aria-label="Call now"
            >
              <Phone size={16} aria-hidden="true" />
              Call Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
