import { Phone, Mail, Globe, MapPin, Award, Shield, Users, TrendingUp } from 'lucide-react';
import {
  REALTOR_NAME,
  PHONE_NUMBER,
  EMAIL_ADDRESS,
  WEBSITE,
  BROKERAGE,
  PARTNER_NAME,
  PARTNER_TITLE,
  PARTNER_COMPANY,
  PARTNER_PHONE,
  PARTNER_EMAIL,
  PARTNER_WEBSITE,
  PARTNER_NMLS,
  PARTNER_ADDRESS
} from '../constants';

const MortgagePartnership = () => {
  return (
    <section className="py-24 md:py-32 lg:py-40 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-gold" />
              <span className="text-gold text-xs sm:text-sm uppercase tracking-[0.3em] font-extrabold">
                Strategic Partnership
              </span>
              <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-gold" />
            </div>
          </div>

          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl text-black mb-6 leading-tight font-bold">
            The Perfect Couple for<br />
            <span className="gradient-text">Your Real Estate Needs</span>
          </h2>

          <p className="text-black/70 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed font-light">
            Experience seamless homeownership with our exclusive partnership. From finding your dream home
            to securing the perfect mortgage, we guide you every step of the way.
          </p>
        </div>

        {/* Partnership Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {/* Lorena's Card */}
          <div className="partnership-card group relative animate-fade-in-up">
            <div className="relative bg-white shadow-premium overflow-hidden border border-gray-200 hover:border-gold transition-premium hover:shadow-gold-glow">
              {/* Image Section */}
              <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                <img
                  src="/images/lorena-professional.jpg"
                  alt={`${REALTOR_NAME}, Professional Realtor`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  width={800}
                  height={450}
                  onError={(e) => {
                    // Fallback to placeholder if image not found
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Overlay Badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                  <h3 className="font-playfair text-3xl text-white mb-1 font-bold">{REALTOR_NAME}</h3>
                  <p className="text-gold text-sm uppercase tracking-widest font-extrabold">Realtor®</p>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 sm:p-8 md:p-12">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="text-gold" size={20} />
                    <p className="text-black font-bold">{BROKERAGE}</p>
                  </div>
                  <p className="text-black/60 text-sm font-light">
                    Your trusted real estate expert with 10+ years of banking experience
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <a href={`tel:${PHONE_NUMBER}`} className="flex items-center gap-3 text-black hover:text-gold transition-premium group/link">
                    <div className="w-10 h-10 bg-gold/5 flex items-center justify-center group-hover/link:bg-gold/10 transition-premium">
                      <Phone size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-black/50 uppercase tracking-wider font-medium">Mobile</p>
                      <p className="font-bold">{PHONE_NUMBER}</p>
                    </div>
                  </a>

                  <a href={`mailto:${EMAIL_ADDRESS}`} className="flex items-center gap-3 text-black hover:text-gold transition-premium group/link">
                    <div className="w-10 h-10 bg-gold/5 flex items-center justify-center group-hover/link:bg-gold/10 transition-premium">
                      <Mail size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-black/50 uppercase tracking-wider font-medium">Email</p>
                      <p className="font-bold text-sm">{EMAIL_ADDRESS}</p>
                    </div>
                  </a>

                  <a href={`https://${WEBSITE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-black hover:text-gold transition-premium group/link">
                    <div className="w-10 h-10 bg-gold/5 flex items-center justify-center group-hover/link:bg-gold/10 transition-premium">
                      <Globe size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-black/50 uppercase tracking-wider font-medium">Website</p>
                      <p className="font-bold text-sm">{WEBSITE}</p>
                    </div>
                  </a>
                </div>

                <a
                  href="#contact"
                  className="block w-full text-center px-6 py-4 bg-gold text-white font-bold uppercase tracking-widest hover:shadow-gold-glow transition-premium text-sm"
                >
                  Find Your Dream Home
                </a>
              </div>
            </div>
          </div>

          {/* Emmanuel's Card */}
          <div className="partnership-card group relative animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="relative bg-white shadow-premium overflow-hidden border border-gray-200 hover:border-gold transition-premium hover:shadow-gold-glow">
              {/* Image Section */}
              <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                <img
                  src="/images/emmanuel-professional.jpg"
                  alt={`${PARTNER_NAME}, ${PARTNER_TITLE} at ${PARTNER_COMPANY}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  width={800}
                  height={450}
                  onError={(e) => {
                    // Fallback to placeholder if image not found
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Company Logo Overlay */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                  <p className="text-xs font-bold text-black">AMERICAN PACIFIC</p>
                  <p className="text-xs text-black/60">MORTGAGE</p>
                </div>

                {/* Overlay Badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                  <h3 className="font-playfair text-3xl text-white mb-1 font-bold">{PARTNER_NAME}</h3>
                  <p className="text-gold text-sm uppercase tracking-widest font-extrabold">{PARTNER_TITLE}</p>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 sm:p-8 md:p-12">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="text-gold" size={20} />
                    <p className="text-black font-bold">{PARTNER_COMPANY}</p>
                  </div>
                  <p className="text-black/60 text-sm font-light">{PARTNER_NMLS}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <a href={`tel:${PARTNER_PHONE}`} className="flex items-center gap-3 text-black hover:text-gold transition-premium group/link">
                    <div className="w-10 h-10 bg-gold/5 flex items-center justify-center group-hover/link:bg-gold/10 transition-premium">
                      <Phone size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-black/50 uppercase tracking-wider font-medium">Mobile</p>
                      <p className="font-bold">{PARTNER_PHONE}</p>
                    </div>
                  </a>

                  <a href={`mailto:${PARTNER_EMAIL}`} className="flex items-center gap-3 text-black hover:text-gold transition-premium group/link">
                    <div className="w-10 h-10 bg-gold/5 flex items-center justify-center group-hover/link:bg-gold/10 transition-premium">
                      <Mail size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-black/50 uppercase tracking-wider font-medium">Email</p>
                      <p className="font-bold text-sm">{PARTNER_EMAIL}</p>
                    </div>
                  </a>

                  <a href={`https://${PARTNER_WEBSITE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-black hover:text-gold transition-premium group/link">
                    <div className="w-10 h-10 bg-gold/5 flex items-center justify-center group-hover/link:bg-gold/10 transition-premium">
                      <Globe size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-black/50 uppercase tracking-wider font-medium">Website</p>
                      <p className="font-bold text-sm">{PARTNER_WEBSITE}</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-3 text-black">
                    <div className="w-10 h-10 bg-gold/5 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-black/50 uppercase tracking-wider font-medium">Office</p>
                      <p className="font-bold text-sm">{PARTNER_ADDRESS}</p>
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${PARTNER_PHONE}`}
                  className="block w-full text-center px-6 py-4 bg-gold text-white font-bold uppercase tracking-widest hover:shadow-gold-glow transition-premium text-sm"
                >
                  Get Pre-Approved
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-black p-6 sm:p-8 md:p-12 lg:p-16 shadow-premium">
          <h3 className="font-playfair text-3xl sm:text-4xl md:text-5xl text-white text-center mb-16 font-bold">
            Why Our Partnership <span className="text-gold">Works For You</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 md:gap-12">
            {[
              {
                icon: Users,
                title: 'Seamless Coordination',
                description: 'One team, one goal - your successful homeownership'
              },
              {
                icon: TrendingUp,
                title: 'Competitive Rates',
                description: 'Access exclusive mortgage rates through our partnership'
              },
              {
                icon: Shield,
                title: 'Trusted Expertise',
                description: '10+ years combined experience in El Paso market'
              },
              {
                icon: Award,
                title: 'End-to-End Service',
                description: 'From property search to closing, we handle it all'
              }
            ].map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gold/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/30 transition-premium">
                  <benefit.icon className="text-gold" size={32} />
                </div>
                <h4 className="text-white font-bold mb-2 text-sm sm:text-base">{benefit.title}</h4>
                <p className="text-white/60 text-xs sm:text-sm font-light">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MortgagePartnership;
