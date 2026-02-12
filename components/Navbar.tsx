import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS, PHONE_NUMBER, COMPANY_NAME } from '../constants';
import { gsap } from '../utils/gsap-config';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollYRef = useRef(0);
  const ticking = useRef(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Hide navbar on landing page
  if (location.pathname === '/landing') return null;

  // Scroll behavior with GSAP (throttled via requestAnimationFrame)
  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        setScrolled(currentScrollY > 50);

        // Hide on scroll down, show on scroll up
        if (navRef.current) {
          if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
            gsap.to(navRef.current, { y: -100, duration: 0.3, ease: 'power2.out' });
          } else {
            gsap.to(navRef.current, { y: 0, duration: 0.3, ease: 'power2.out' });
          }
        }

        lastScrollYRef.current = currentScrollY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
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
      ref={navRef}
      className={`navbar fixed w-full z-50 transition-premium ${
        scrolled ? 'bg-white border-b border-gray-200 shadow-premium py-4' : 'bg-white py-6'
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center" aria-label="The Right Move Real Estate Group Home">
            <img
              src="/images/logo/right_move.png"
              alt="The Right Move Real Estate Group"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm uppercase tracking-widest text-dark hover:text-gold transition-premium font-lato font-semibold"
              >
                {link.label}
              </a>
            ))}
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="flex items-center gap-2 border-2 border-gold text-gold px-4 py-2 hover:bg-gold hover:text-white transition-premium uppercase text-xs tracking-widest font-bold"
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
              className="text-dark hover:text-gold transition-premium p-2"
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
          className="md:hidden bg-white border-t border-gray-200 absolute w-full shadow-premium"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="px-4 pt-2 pb-8 space-y-4 flex flex-col items-center">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-3 py-2 text-base font-semibold text-black hover:text-gold transition-premium uppercase tracking-widest"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="mt-4 flex items-center gap-2 bg-gold text-white px-6 py-3 font-bold uppercase tracking-widest hover:shadow-gold-glow transition-premium"
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
