import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AboutPreview from '../components/AboutPreview';
import Services from '../components/Services';
import MortgagePartnership from '../components/MortgagePartnership';
import NeighborhoodGuide from '../components/NeighborhoodGuide';
import Testimonials from '../components/Testimonials';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';
import ContactForm from '../components/ContactForm';

const Home  = () => {
  return (
    <div className="bg-white min-h-screen">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <AboutPreview />
        <Services />
        <MortgagePartnership />
        <NeighborhoodGuide />
        <Testimonials />
      
      {/* Homepage Contact Section */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-gray-200 p-8 md:p-12 shadow-2xl relative overflow-hidden rounded-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full pointer-events-none"></div>
            <div className="text-center mb-10">
              <span className="text-gold text-xs uppercase tracking-[0.25em]">Let's Connect</span>
              <h2 className="mt-2 font-serif text-3xl md:text-4xl text-gray-900">Start Your Journey</h2>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

        <CTABanner />
      </main>
      <Footer />
    </div>
  );
};

export default Home;