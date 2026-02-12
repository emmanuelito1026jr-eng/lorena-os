import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { STATS } from '../constants';
import { ArrowRight, Award, TrendingUp, Users, Languages, Phone } from 'lucide-react';
import { staggerReveal } from '../utils/animations';

const AboutPreview = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    staggerReveal('.stat-item', 0.1);
  }, []);

  return (
    <section id="about" className="py-24 md:py-32 lg:py-40 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Image Side */}
          <div className="relative group">
            {/* Floating Badge Icons */}
            <div className="absolute -top-6 -right-6 z-20 hidden md:flex gap-2">
              <div className="w-12 h-12 bg-gold flex items-center justify-center shadow-premium animate-float">
                <Award className="text-white" size={24} />
              </div>
            </div>
            <div className="absolute top-1/4 -left-6 z-20 hidden md:flex">
              <div className="w-12 h-12 bg-white border-2 border-gold flex items-center justify-center shadow-premium animate-float" style={{ animationDelay: '0.5s' }}>
                <Languages className="text-gold" size={24} />
              </div>
            </div>

            {/* Main Image with clip-path */}
            <div className="relative z-10 aspect-[4/5] overflow-hidden clip-angle-top-right">
              <img
                src="/images/lorena-portrait.png"
                alt="Lorena Ontiveros-Ortega, professional real estate agent"
                className={`w-full h-full object-cover transition-premium ${
                  imageLoaded ? 'scale-100' : 'scale-105'
                }`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  // Fallback to alternative image if portrait not found
                  e.currentTarget.src = '/images/lorena-professional.jpg';
                }}
              />
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-premium" />

              {/* Contact Me Button - overlaid on photo */}
              <a
                href="#contact"
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-gold text-white px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-gold transition-premium shadow-lg opacity-90 group-hover:opacity-100"
              >
                <Phone size={16} />
                Contact Me
              </a>
            </div>

            {/* Name Badge */}
            <div className="absolute -bottom-4 right-0 sm:-bottom-6 sm:-right-6 bg-gold text-white px-6 sm:px-8 py-3 sm:py-4 z-20 shadow-gold-glow group-hover:shadow-gold-glow-lg transition-premium">
              <span className="font-sans font-black text-lg sm:text-xl block">Lorena Ontiveros</span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest block font-extrabold">Realtor® & Financial Expert</span>
            </div>
          </div>

          {/* Text Side */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-3 block font-extrabold">Meet Your Agent</span>
              <h3 className="font-sans text-4xl sm:text-5xl md:text-6xl text-black mb-4 sm:mb-6 leading-tight font-bold">
                Bridging Cultures,<br/>
                <span className="gradient-text">Building Wealth</span>
              </h3>
              <div className="space-y-4 text-black/70 text-base sm:text-lg leading-relaxed font-light">
                <p>
                  I don't just find you a home; <strong className="text-black font-bold">I make sure you can afford it</strong>. With over <strong className="text-gold font-bold">10 years of banking experience</strong> and a BBA in Marketing from UTEP, I bring a financial strategist's mindset to every transaction.
                </p>
                <p>
                  Growing up in both <strong className="text-gold font-bold">El Paso and Cd. Juárez</strong>, I understand the unique pulse of our border community. Whether you prefer English or Spanish, I treat you like family.
                </p>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, text: '10+ Years Banking' },
                { icon: Languages, text: 'Fully Bilingual' },
                { icon: Users, text: '100+ Families Served' },
                { icon: Award, text: 'UTEP Graduate' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-white border border-gray-200 p-4 hover-lift shadow-premium hover:shadow-gold-glow transition-premium">
                  <div className="w-10 h-10 bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="text-gold" size={18} />
                  </div>
                  <span className="text-black text-sm font-semibold">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-gray-200">
              {STATS.map((stat, index) => (
                <div key={index} className="stat-item group">
                  <p className="text-2xl sm:text-3xl font-sans font-black text-gold mb-1 group-hover:scale-110 transition-premium inline-block">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-black/60 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Link
                to="/about"
                className="group inline-flex items-center gap-2 text-black hover:text-gold transition-premium relative"
              >
                <span className="font-bold uppercase tracking-widest text-sm border-b-2 border-gold pb-1">
                  Read Full Bio
                </span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-premium" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutPreview;