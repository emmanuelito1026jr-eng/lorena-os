import { Award, GraduationCap, TrendingUp, Users, MapPin, Languages, Heart, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactForm from '../components/ContactForm';
import { STATS, TESTIMONIALS } from '../constants';

const About = () => {
  return (
    <div className="bg-dark min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-b from-dark-charcoal to-dark overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <div className="animate-fade-in-up">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-gold/20 to-transparent blur-2xl"></div>
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg border-4 border-gold/30">
                  <img
                    src="/images/lorena-portrait.png"
                    alt="Lorena Ontiveros-Ortega, professional real estate agent"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    loading="lazy"
                  />
                </div>
                {/* Floating Stats */}
                <div className="absolute -bottom-6 -right-6 glass-strong p-6 rounded-lg">
                  <div className="text-4xl font-sans text-gold mb-1">10+</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Years Banking</div>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="animate-fade-in-up delay-200">
              <span className="text-gold text-xs uppercase tracking-[0.3em]">About Lorena</span>
              <h1 className="mt-4 font-sans text-5xl md:text-6xl text-ivory mb-6">
                Bridging Cultures, <br />
                <span className="gradient-text italic">Building Wealth</span>
              </h1>

              <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                <p>
                  I'm <strong className="text-gold">Lorena Ontiveros-Ortega</strong>, and I don't just find you a home —
                  I make sure you can afford it. With over <strong>10 years of banking experience</strong> and a
                  <strong> BBA in Marketing from UTEP</strong>, I bring a financial strategist's mindset to every transaction.
                </p>

                <p>
                  Growing up in both <strong className="text-gold">El Paso and Ciudad Juárez</strong>, I understand
                  the unique pulse of our border community. Whether you prefer English or Spanish,
                  I treat you like family — because in our culture, that's what matters most.
                </p>

                <p>
                  I specialize in helping first-time buyers navigate complex mortgage processes,
                  guiding sellers to maximize their home's value, and connecting investors with
                  lucrative opportunities on both sides of the border.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
                {STATS.map((stat, index) => (
                  <div key={index} className="glass rounded-lg p-3 sm:p-4 hover-lift">
                    <div className="text-xl sm:text-2xl font-sans text-gold mb-1">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Career Timeline */}
      <section className="py-20 px-4 bg-dark-charcoal">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="text-gold text-xs uppercase tracking-[0.3em]">My Journey</span>
            <h2 className="mt-4 font-sans text-4xl md:text-5xl text-ivory">
              From Banking to <span className="gradient-text">Real Estate</span>
            </h2>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-gold via-gold/50 to-transparent hidden md:block"></div>

            <div className="space-y-12">
              {[
                {
                  year: '2014',
                  title: 'Banking Career Begins',
                  description: 'Started in financial services, developing expertise in mortgages, credit analysis, and wealth management.',
                  icon: TrendingUp,
                  side: 'left'
                },
                {
                  year: '2018',
                  title: 'UTEP Graduate',
                  description: 'Earned BBA in Marketing from The University of Texas at El Paso, combining financial knowledge with marketing strategy.',
                  icon: GraduationCap,
                  side: 'right'
                },
                {
                  year: '2020',
                  title: 'Real Estate License',
                  description: 'Transitioned to real estate, bringing unique financial expertise that most agents don\'t have.',
                  icon: Award,
                  side: 'left'
                },
                {
                  year: '2024',
                  title: 'Independent Practice',
                  description: 'Established independent real estate practice, serving 100+ families across El Paso with personalized service.',
                  icon: Users,
                  side: 'right'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className={`relative grid md:grid-cols-2 gap-8 items-center animate-fade-in-up`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {item.side === 'left' ? (
                    <>
                      {/* Content Left */}
                      <div className="md:text-right">
                        <div className="glass-strong rounded-lg p-4 sm:p-6 hover-lift inline-block w-full md:w-auto">
                          <div className="flex md:hidden items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                              <item.icon className="text-dark" size={20} />
                            </div>
                            <div className="text-gold text-xs uppercase tracking-wider">{item.year}</div>
                          </div>
                          <div className="hidden md:block text-gold text-xs uppercase tracking-wider mb-2">{item.year}</div>
                          <h3 className="text-ivory text-xl sm:text-2xl font-sans mb-2 sm:mb-3">{item.title}</h3>
                          <p className="text-gray-400 text-sm sm:text-base">{item.description}</p>
                        </div>
                      </div>
                      {/* Icon Center */}
                      <div className="hidden md:flex justify-center">
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gold rounded-full flex items-center justify-center">
                          <item.icon className="text-dark" size={28} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Icon Center */}
                      <div className="hidden md:flex justify-center">
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gold rounded-full flex items-center justify-center">
                          <item.icon className="text-dark" size={28} />
                        </div>
                      </div>
                      {/* Content Right */}
                      <div>
                        <div className="glass-strong rounded-lg p-4 sm:p-6 hover-lift inline-block w-full md:w-auto">
                          <div className="flex md:hidden items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                              <item.icon className="text-dark" size={20} />
                            </div>
                            <div className="text-gold text-xs uppercase tracking-wider">{item.year}</div>
                          </div>
                          <div className="hidden md:block text-gold text-xs uppercase tracking-wider mb-2">{item.year}</div>
                          <h3 className="text-ivory text-xl sm:text-2xl font-sans mb-2 sm:mb-3">{item.title}</h3>
                          <p className="text-gray-400 text-sm sm:text-base">{item.description}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Lorena */}
      <section className="py-20 px-4 bg-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="text-gold text-xs uppercase tracking-[0.3em]">Competitive Advantage</span>
            <h2 className="mt-4 font-sans text-4xl md:text-5xl text-ivory">
              Why Choose <span className="gradient-text">Lorena?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: 'Financial Expertise',
                description: '10+ years in banking means I can guide you through mortgage pre-approval, credit optimization, and investment strategy.',
                color: 'gold'
              },
              {
                icon: Languages,
                title: 'Truly Bilingual',
                description: 'Native fluency in English and Spanish. I can explain complex real estate terms in the language you\'re most comfortable with.',
                color: 'gold'
              },
              {
                icon: MapPin,
                title: 'Border Expertise',
                description: 'Grew up in El Paso and Juárez. I understand cross-border investment, commuter lifestyles, and cultural nuances.',
                color: 'gold'
              },
              {
                icon: Users,
                title: 'Client-First Approach',
                description: 'You\'re not just a transaction. I build long-term relationships and treat every client like family.',
                color: 'gold'
              },
              {
                icon: Award,
                title: 'Proven Track Record',
                description: '100+ families served with 5-star reviews. My clients trust me with their biggest financial decisions.',
                color: 'gold'
              },
              {
                icon: Heart,
                title: 'Community Focused',
                description: 'El Paso native giving back to the community. I invest in local schools, charities, and neighborhood events.',
                color: 'gold'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="glass-strong rounded-lg p-6 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mb-4">
                  <item.icon className="text-gold" size={28} />
                </div>
                <h3 className="text-ivory text-xl font-sans mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Testimonials */}
      <section className="py-20 px-4 bg-dark-charcoal">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="text-gold text-xs uppercase tracking-[0.3em]">Client Success Stories</span>
            <h2 className="mt-4 font-sans text-4xl md:text-5xl text-ivory">
              What Families <span className="gradient-text">Are Saying</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div
                key={index}
                className="glass-strong rounded-lg p-6 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-gray-300 italic mb-4">"{testimonial.text}"</p>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-ivory font-semibold">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-4 bg-dark">
        <div className="max-w-4xl mx-auto">
          <div className="glass-strong rounded-lg p-12 text-center animate-fade-in-up">
            <h2 className="font-sans text-4xl md:text-5xl text-ivory mb-6">
              Ready to Find Your <span className="gradient-text">Dream Home?</span>
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Let's start a conversation about your real estate goals. Whether you're buying, selling, or investing,
              I'm here to guide you every step of the way.
            </p>
            <ContactForm minimal={true} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
