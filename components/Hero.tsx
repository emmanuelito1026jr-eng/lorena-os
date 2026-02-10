import { ArrowRight, ChevronDown } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden" aria-label="Hero section">
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0 z-0">
        {/* PLACEHOLDER: Replace with actual photo of El Paso skyline or Franklin Mountains at sunset */}
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(https://placehold.co/1920x1080/1A1A1A/C9A84C?text=El+Paso+Skyline)`,
            transform: `translateY(calc(var(--scroll) * 0.5px))`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-dark"></div>

        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 animate-pulse-gold"></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-gold/5 rounded-full blur-3xl animate-pulse-gold"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse-gold delay-500"></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center sm:px-6 lg:px-8 pt-20">
        <span className="block text-gold text-sm md:text-base uppercase tracking-[0.3em] mb-4 animate-fade-in">
          Luxury Real Estate in El Paso
        </span>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-ivory mb-6 leading-tight animate-fade-in-up delay-100">
          Tu Hogar, <br className="md:hidden" />
          <span className="gradient-text italic">Tu Futuro</span>
        </h1>

        <p className="max-w-2xl mx-auto text-gray-300 text-lg md:text-xl mb-10 font-light leading-relaxed animate-fade-in-up delay-200">
          El Paso's Bilingual Real Estate Expert — Helping families on both sides of the border find their place in the world.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-300">
          <a
            href="#contact"
            className="group relative w-full sm:w-auto px-8 py-4 bg-gold text-dark font-bold uppercase tracking-widest overflow-hidden hover:shadow-2xl hover:shadow-gold/50 transition-all duration-300 flex items-center justify-center gap-2"
            aria-label="Get started - contact Lorena"
          >
            <span className="relative z-10">Get Started</span>
            <ArrowRight size={16} aria-hidden="true" className="relative z-10 group-hover:translate-x-1 transition-transform" />

            {/* Shimmer Effect */}
            <div className="absolute inset-0 shimmer"></div>
          </a>
          <a
            href="#contact"
            className="group w-full sm:w-auto px-8 py-4 border-2 border-ivory text-ivory font-bold uppercase tracking-widest hover:bg-ivory hover:text-dark transition-all duration-300 relative overflow-hidden"
            aria-label="Contact Lorena Ontiveros-Ortega"
          >
            <span className="relative z-10">Contact Me</span>

            {/* Slide-in background */}
            <div className="absolute inset-0 bg-ivory transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
          </a>
        </div>

        {/* Stats Row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-in-up delay-400">
          {[
            { value: '100+', label: 'Families Served' },
            { value: '10+', label: 'Years Experience' },
            { value: '5.0', label: 'Client Rating' },
            { value: '100%', label: 'Bilingual' }
          ].map((stat, index) => (
            <div key={index} className="glass rounded-lg p-4 hover-lift">
              <div className="text-3xl md:text-4xl font-serif text-gold mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <a
        href="#about"
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer group"
        aria-label="Scroll to about section"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-gold to-transparent"></div>
          <ChevronDown className="text-gold group-hover:text-white transition-colors" size={24} />
        </div>
      </a>
    </section>
  );
};

export default Hero;
