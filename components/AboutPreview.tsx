import { useState } from 'react';
import { Link } from 'react-router-dom';
import { STATS } from '../constants';
import { ArrowRight, Award, TrendingUp, Users, Languages } from 'lucide-react';

const AboutPreview = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section id="about" className="py-20 md:py-32 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-gold/15 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Image Side */}
          <div className="relative group animate-fade-in-up">
            {/* Decorative Border */}
            <div className="absolute -top-4 -left-4 w-full h-full border-2 border-gold/40 z-0 group-hover:border-gold transition-colors duration-500" />

            {/* Floating Badge Icons */}
            <div className="absolute -top-6 -right-6 z-20 flex gap-2">
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center shadow-xl animate-float">
                <Award className="text-dark" size={24} />
              </div>
            </div>
            <div className="absolute top-1/4 -left-6 z-20">
              <div className="w-12 h-12 bg-white border-2 border-gold rounded-full flex items-center justify-center shadow-xl animate-float" style={{ animationDelay: '0.5s' }}>
                <Languages className="text-gold" size={24} />
              </div>
            </div>

            {/* Main Image */}
            <div className="relative z-10 aspect-[4/5] overflow-hidden rounded-sm">
              {/* PLACEHOLDER: Replace with professional headshot of Lorena Ontiveros-Ortega */}
              <img
                src="https://placehold.co/800x1000/1A1A1A/C9A84C?text=Lorena+Ontiveros"
                alt="Lorena Ontiveros-Ortega, professional real estate agent"
                className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ${
                  imageLoaded ? 'scale-100' : 'scale-105'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Name Badge */}
            <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-gold to-gold/80 text-dark px-6 sm:px-8 py-3 sm:py-4 z-20 shadow-2xl group-hover:shadow-gold/50 transition-all duration-500">
              <span className="font-serif font-bold text-lg sm:text-xl block">Lorena Ontiveros</span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest block opacity-80">Realtor® & Financial Expert</span>
            </div>
          </div>

          {/* Text Side */}
          <div className="space-y-6 sm:space-y-8 animate-fade-in-up delay-200">
            <div>
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-3 block font-bold">Meet Your Agent</span>
              <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-4 sm:mb-6 leading-tight">
                Bridging Cultures,<br/>
                <span className="gradient-text italic">Building Wealth</span>
              </h3>
              <div className="space-y-4 text-gray-700 text-base sm:text-lg leading-relaxed">
                <p>
                  I don't just find you a home; <strong className="text-gray-900">I make sure you can afford it</strong>. With over <strong className="text-gold">10 years of banking experience</strong> and a BBA in Marketing from UTEP, I bring a financial strategist's mindset to every transaction.
                </p>
                <p>
                  Growing up in both <strong className="text-gold">El Paso and Cd. Juárez</strong>, I understand the unique pulse of our border community. Whether you prefer English or Spanish, I treat you like family.
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
                <div key={index} className="flex items-center gap-3 bg-white border border-gray-200 p-3 rounded hover-lift shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <item.icon className="text-gold" size={18} />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-gray-200">
              {STATS.map((stat, index) => (
                <div key={index} className="group">
                  <p className="text-2xl sm:text-3xl font-serif text-gold mb-1 group-hover:scale-110 transition-transform inline-block">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Link
                to="/about"
                className="group inline-flex items-center gap-2 text-gray-900 hover:text-gold transition-colors relative"
              >
                <span className="font-bold uppercase tracking-widest text-sm border-b-2 border-gold pb-1">
                  Read Full Bio
                </span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutPreview;