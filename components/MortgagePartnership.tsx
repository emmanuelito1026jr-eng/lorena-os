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
    <section className="py-20 sm:py-32 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-gold" />
              <span className="text-gold text-xs sm:text-sm uppercase tracking-[0.3em] font-bold">
                Strategic Partnership
              </span>
              <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-gold" />
            </div>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-6 leading-tight">
            The Perfect Couple for<br />
            <span className="gradient-text">Your Real Estate Needs</span>
          </h2>

          <p className="text-gray-600 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            Experience seamless homeownership with our exclusive partnership. From finding your dream home
            to securing the perfect mortgage, we guide you every step of the way.
          </p>
        </div>

        {/* Partnership Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Lorena's Card */}
          <div className="group relative animate-fade-in-up delay-100">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 hover:border-gold/30 transition-all duration-500 hover:shadow-gold/20 hover:-translate-y-2">
              {/* Image Section */}
              <div className="relative h-80 sm:h-96 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                <img
                  src="/images/lorena-professional.jpg"
                  alt={`${REALTOR_NAME}, Professional Realtor`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image not found
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Overlay Badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                  <h3 className="font-serif text-3xl text-white mb-1">{REALTOR_NAME}</h3>
                  <p className="text-gold text-sm uppercase tracking-widest font-bold">Realtor®</p>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8">
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="text-gold" size={20} />
                    <p className="text-gray-900 font-semibold">{BROKERAGE}</p>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Your trusted real estate expert with 10+ years of banking experience
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <a href={`tel:${PHONE_NUMBER}`} className="flex items-center gap-3 text-gray-700 hover:text-gold transition-colors group/link">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover/link:bg-gold/10 transition-colors">
                      <Phone size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Mobile</p>
                      <p className="font-semibold">{PHONE_NUMBER}</p>
                    </div>
                  </a>

                  <a href={`mailto:${EMAIL_ADDRESS}`} className="flex items-center gap-3 text-gray-700 hover:text-gold transition-colors group/link">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover/link:bg-gold/10 transition-colors">
                      <Mail size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                      <p className="font-semibold text-sm">{EMAIL_ADDRESS}</p>
                    </div>
                  </a>

                  <a href={`https://${WEBSITE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-gold transition-colors group/link">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover/link:bg-gold/10 transition-colors">
                      <Globe size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Website</p>
                      <p className="font-semibold text-sm">{WEBSITE}</p>
                    </div>
                  </a>
                </div>

                <a
                  href="#contact"
                  className="block w-full text-center px-6 py-4 bg-gradient-to-r from-gold to-gold/90 text-white font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-gold/30 transition-all text-sm"
                >
                  Find Your Dream Home
                </a>
              </div>
            </div>
          </div>

          {/* Emmanuel's Card */}
          <div className="group relative animate-fade-in-up delay-200">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 hover:border-gold/30 transition-all duration-500 hover:shadow-gold/20 hover:-translate-y-2">
              {/* Image Section */}
              <div className="relative h-80 sm:h-96 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                <img
                  src="/images/emmanuel-professional.jpg"
                  alt={`${PARTNER_NAME}, ${PARTNER_TITLE} at ${PARTNER_COMPANY}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image not found
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Company Logo Overlay */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                  <p className="text-xs font-bold text-blue-600">AMERICAN PACIFIC</p>
                  <p className="text-xs text-gray-600">MORTGAGE</p>
                </div>

                {/* Overlay Badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                  <h3 className="font-serif text-3xl text-white mb-1">{PARTNER_NAME}</h3>
                  <p className="text-gold text-sm uppercase tracking-widest font-bold">{PARTNER_TITLE}</p>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8">
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="text-blue-600" size={20} />
                    <p className="text-gray-900 font-semibold">{PARTNER_COMPANY}</p>
                  </div>
                  <p className="text-gray-600 text-sm">{PARTNER_NMLS}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <a href={`tel:${PARTNER_PHONE}`} className="flex items-center gap-3 text-gray-700 hover:text-gold transition-colors group/link">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover/link:bg-gold/10 transition-colors">
                      <Phone size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Mobile</p>
                      <p className="font-semibold">{PARTNER_PHONE}</p>
                    </div>
                  </a>

                  <a href={`mailto:${PARTNER_EMAIL}`} className="flex items-center gap-3 text-gray-700 hover:text-gold transition-colors group/link">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover/link:bg-gold/10 transition-colors">
                      <Mail size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                      <p className="font-semibold text-sm">{PARTNER_EMAIL}</p>
                    </div>
                  </a>

                  <a href={`https://${PARTNER_WEBSITE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-gold transition-colors group/link">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover/link:bg-gold/10 transition-colors">
                      <Globe size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Website</p>
                      <p className="font-semibold text-sm">{PARTNER_WEBSITE}</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Office</p>
                      <p className="font-semibold text-sm">{PARTNER_ADDRESS}</p>
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${PARTNER_PHONE}`}
                  className="block w-full text-center px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-blue-600/30 transition-all text-sm"
                >
                  Get Pre-Approved
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 sm:p-12 shadow-2xl animate-fade-in-up delay-300">
          <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white text-center mb-12">
            Why Our Partnership <span className="text-gold">Works For You</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/30 transition-colors">
                  <benefit.icon className="text-gold" size={32} />
                </div>
                <h4 className="text-white font-bold mb-2 text-sm sm:text-base">{benefit.title}</h4>
                <p className="text-gray-400 text-xs sm:text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MortgagePartnership;
