import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactForm from '../components/ContactForm';
import { CheckCircle, ArrowRight, TrendingUp, Shield, Clock, Award, Heart, Users, DollarSign, Home as HomeIcon, ChevronLeft } from 'lucide-react';

const SERVICES_DATA = {
  buyers: {
    id: 'buyers',
    title: 'Buyer Services',
    subtitle: 'Compradores',
    tagline: 'Find Your Perfect Home with Expert Financial Guidance',
    hero: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=800&fit=crop&q=80',
    description: 'With 10+ years of banking experience, I bring unique financial expertise to your home buying journey. I don\'t just help you find a home—I ensure you can afford it and build wealth through smart real estate decisions.',

    processSteps: [
      {
        number: '01',
        title: 'Financial Pre-Qualification',
        description: 'We start by analyzing your financial situation, credit profile, and mortgage readiness. I help optimize your credit score and debt-to-income ratio before we even start shopping.',
        icon: DollarSign,
        duration: '1-2 weeks'
      },
      {
        number: '02',
        title: 'Strategic Home Search',
        description: 'Using your budget and lifestyle needs, I identify properties that match your criteria. You\'ll get access to exclusive listings and off-market opportunities.',
        icon: HomeIcon,
        duration: '2-8 weeks'
      },
      {
        number: '03',
        title: 'Expert Negotiation',
        description: 'I leverage market data and my negotiation skills to get you the best price. My financial background helps identify value and hidden costs.',
        icon: TrendingUp,
        duration: '1-2 weeks'
      },
      {
        number: '04',
        title: 'Smooth Closing',
        description: 'I guide you through inspections, appraisals, and closing paperwork. You\'ll understand every document and fee—no surprises.',
        icon: CheckCircle,
        duration: '3-4 weeks'
      }
    ],

    benefits: [
      'Mortgage pre-approval assistance with lender connections',
      'First-time buyer programs and grant identification',
      'Credit optimization strategies before applying',
      'Off-market and exclusive listing access',
      'Neighborhood investment potential analysis',
      'Bilingual support (English/Spanish) throughout',
      'Home inspection coordination and negotiation',
      'Closing cost breakdown and explanation'
    ],

    faqs: [
      {
        q: 'How much money do I need for a down payment?',
        a: 'Down payments typically range from 3% to 20% depending on your loan type. FHA loans can be as low as 3.5%, conventional loans often require 5-20%, and VA loans (for veterans) can be 0%. I help you explore all options and find the best fit for your situation.'
      },
      {
        q: 'What credit score do I need?',
        a: 'While conventional loans prefer 620+, FHA loans can work with scores as low as 580. If your score needs improvement, I provide specific strategies to boost it before applying. My banking background means I know exactly what lenders look for.'
      },
      {
        q: 'How long does the home buying process take?',
        a: 'From pre-approval to closing typically takes 2-4 months. However, it varies based on market conditions, your responsiveness, and loan type. I keep the process moving efficiently while ensuring you never feel rushed.'
      },
      {
        q: 'Do you work with first-time buyers?',
        a: 'Absolutely! Over 60% of my clients are first-time buyers. I specialize in making the process clear, manageable, and even exciting. You\'ll understand every step and feel confident in your decisions.'
      }
    ],

    testimonials: [
      {
        name: 'Familia Rodriguez',
        text: 'Lorena\'s banking background was invaluable. She helped us improve our credit score by 40 points in 3 months, which saved us thousands in interest. ¡Gracias!',
        role: 'First-Time Buyers, Westside'
      },
      {
        name: 'James & Maria Chen',
        text: 'We were pre-approved elsewhere but Lorena found us a better rate and explained everything in terms we understood. Her bilingual service helped us communicate with our Spanish-speaking family.',
        role: 'Homebuyers, Horizon City'
      }
    ]
  },

  sellers: {
    id: 'sellers',
    title: 'Seller Services',
    subtitle: 'Vendedores',
    tagline: 'Maximize Your Home\'s Value with Strategic Marketing',
    hero: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=800&fit=crop&q=80',
    description: 'Selling your home is one of the biggest financial decisions you\'ll make. With my marketing expertise and market knowledge, I position your property to sell quickly and for top dollar—often above asking price.',

    processSteps: [
      {
        number: '01',
        title: 'Property Valuation & Strategy',
        description: 'I analyze comparable sales, market trends, and your home\'s unique features to determine optimal pricing. We create a strategic plan tailored to your timeline and goals.',
        icon: TrendingUp,
        duration: '1 week'
      },
      {
        number: '02',
        title: 'Home Preparation & Staging',
        description: 'I provide specific recommendations for repairs, improvements, and staging that deliver maximum ROI. Small investments can yield thousands in additional profit.',
        icon: HomeIcon,
        duration: '2-4 weeks'
      },
      {
        number: '03',
        title: 'Professional Marketing',
        description: 'Your home gets professional photography, virtual tours, targeted digital ads, social media promotion, and exposure on all major platforms. I market in both English and Spanish to reach El Paso\'s entire market.',
        icon: Award,
        duration: 'Ongoing'
      },
      {
        number: '04',
        title: 'Negotiation & Closing',
        description: 'I manage showings, evaluate offers, and negotiate terms to maximize your net proceeds. You\'ll know exactly what you\'re walking away with.',
        icon: DollarSign,
        duration: '2-6 weeks'
      }
    ],

    benefits: [
      'Professional photography and virtual tours included',
      'Bilingual marketing (English/Spanish) doubles your buyer pool',
      'Strategic pricing based on real-time market data',
      'Home staging consultation and vendor connections',
      'Pre-listing inspection option to avoid surprises',
      'Targeted social media and digital advertising',
      'MLS exposure plus exclusive buyer network access',
      'Detailed net proceeds calculation before listing'
    ],

    faqs: [
      {
        q: 'How do you determine my home\'s value?',
        a: 'I use a Comparative Market Analysis (CMA) looking at recent sales of similar homes, current market conditions, and your home\'s unique features. My financial background helps me identify value that other agents might miss.'
      },
      {
        q: 'What updates should I make before selling?',
        a: 'I provide a prioritized list of improvements with estimated ROI. Typically, fresh paint, minor repairs, and deep cleaning deliver the best returns. I can connect you with trusted, affordable contractors.'
      },
      {
        q: 'How long will it take to sell?',
        a: 'In El Paso\'s current market, properly priced homes sell in 14-45 days on average. Factors include price, condition, location, and season. I\'ll give you realistic expectations based on your specific situation.'
      },
      {
        q: 'What are the costs of selling?',
        a: 'Typical costs include agent commission (negotiable), title fees, potential repairs, and closing costs. I provide a detailed net proceeds estimate upfront so you know exactly what to expect.'
      }
    ],

    testimonials: [
      {
        name: 'Elena M.',
        text: 'Lorena sold my Upper Valley home for $18K above asking in just 11 days. Her marketing was incredible—professional photos, virtual tour, social media ads. Worth every penny of her commission.',
        role: 'Seller, Upper Valley'
      },
      {
        name: 'David Santos',
        text: 'She gave us specific staging advice that cost $300 but added $8,000 to our sale price. Her eye for what buyers want is spot-on.',
        role: 'Seller, Westside'
      }
    ]
  },

  investors: {
    id: 'investors',
    title: 'Investment Services',
    subtitle: 'Inversiones',
    tagline: 'Build Wealth Through Strategic Real Estate Investing',
    hero: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=800&fit=crop&q=80',
    description: 'El Paso\'s border location creates unique investment opportunities. I help you identify high-ROI properties, analyze cash flow potential, and build a real estate portfolio that generates passive income and long-term wealth.',

    processSteps: [
      {
        number: '01',
        title: 'Investment Goals Analysis',
        description: 'We define your investment objectives—cash flow, appreciation, tax benefits, or diversification. I help you understand the El Paso market and cross-border opportunities.',
        icon: TrendingUp,
        duration: '1-2 weeks'
      },
      {
        number: '02',
        title: 'Property Identification',
        description: 'I source properties matching your criteria: single-family rentals, multi-family units, or commercial opportunities. You get financial analysis including cap rate, cash-on-cash return, and projected appreciation.',
        icon: HomeIcon,
        duration: '4-12 weeks'
      },
      {
        number: '03',
        title: 'Due Diligence & Analysis',
        description: 'I coordinate inspections, rental comps, and financial modeling. You\'ll see detailed projections before making an offer.',
        icon: Shield,
        duration: '2-3 weeks'
      },
      {
        number: '04',
        title: 'Portfolio Management Support',
        description: 'After closing, I connect you with property managers, contractors, and tax professionals to optimize your investment.',
        icon: Award,
        duration: 'Ongoing'
      }
    ],

    benefits: [
      'Cash flow analysis and ROI projections for every property',
      'Border market expertise (El Paso-Juárez corridor)',
      'Rental market analysis and pricing guidance',
      'Property manager and contractor referrals',
      '1031 exchange consultation and coordination',
      'Multi-family and commercial property access',
      'Investment-specific financing connections',
      'Tax strategy consultation (with your CPA)'
    ],

    faqs: [
      {
        q: 'Is El Paso a good market for rental properties?',
        a: 'Yes! El Paso has strong rental demand from military (Fort Bliss), UTEP students, and cross-border commuters. Average rental yields are 8-12%, and property appreciation has been steady at 4-6% annually.'
      },
      {
        q: 'How much money do I need to start investing?',
        a: 'Investment properties typically require 15-25% down. For a $200K property, expect $30-50K down plus reserves. I can show you strategies to start with less through house hacking or partnerships.'
      },
      {
        q: 'Do you help with property management?',
        a: 'While I don\'t manage properties myself, I connect you with vetted property managers and help you evaluate whether self-management or professional management makes sense for your situation.'
      },
      {
        q: 'What about investing in Juárez?',
        a: 'I can provide market insights and connections for Juárez investments. The process differs from US real estate, but the cross-border opportunities can be lucrative. I\'ll help you understand the risks and rewards.'
      }
    ],

    testimonials: [
      {
        name: 'Carlos Hernandez',
        text: 'Lorena helped me build a 3-property portfolio in 18 months. Her financial analysis was thorough and her projections were accurate. I\'m now earning $2,400/month in passive income.',
        role: 'Investor, Multiple Properties'
      },
      {
        name: 'Sarah & Mike Johnson',
        text: 'We were hesitant about real estate investing, but Lorena made it clear and achievable. She found us a duplex in Horizon City that cash flows $600/month after expenses.',
        role: 'Investors, Horizon City'
      }
    ]
  }
};

const ServiceDetail = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const service = serviceId ? SERVICES_DATA[serviceId as keyof typeof SERVICES_DATA] : null;

  if (!service) {
    return (
      <div className="bg-dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-sans text-gold mb-4">Service Not Found</h1>
          <Link to="/#services" className="text-ivory hover:text-gold">
            ← Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={service.hero} alt={service.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-dark"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 animate-pulse-gold"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Link to="/#services" className="inline-flex items-center gap-2 text-gold hover:text-white mb-6 animate-fade-in">
            <ChevronLeft size={16} />
            Back to Services
          </Link>

          <div className="text-xs uppercase tracking-[0.3em] text-gold mb-4 animate-fade-in">
            {service.subtitle}
          </div>

          <h1 className="font-sans text-5xl md:text-7xl text-ivory mb-6 animate-fade-in-up delay-100">
            {service.title}
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-fade-in-up delay-200">
            {service.tagline}
          </p>

          <a href="#contact" className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white transition-all animate-fade-in-up delay-300">
            Get Started
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Description */}
      <section className="py-20 px-4 bg-dark-charcoal">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-gray-300 leading-relaxed animate-fade-in-up">
            {service.description}
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 px-4 bg-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-4xl md:text-5xl text-ivory mb-4">
              The <span className="gradient-text">Process</span>
            </h2>
            <p className="text-gray-400 text-lg">Step-by-step guidance from start to finish</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {service.processSteps.map((step, index) => (
              <div
                key={index}
                className="glass-strong rounded-lg p-6 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-6xl font-sans text-gold/20 mb-4">{step.number}</div>
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mb-4">
                  <step.icon className="text-gold" size={28} />
                </div>
                <h3 className="text-xl font-sans text-ivory mb-3">{step.title}</h3>
                <p className="text-gray-400 mb-4">{step.description}</p>
                <div className="flex items-center gap-2 text-sm text-gold">
                  <Clock size={14} />
                  <span>{step.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-dark-charcoal">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-4xl md:text-5xl text-ivory mb-4">
              What's <span className="gradient-text">Included</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-3 glass rounded-lg p-4 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CheckCircle className="text-gold shrink-0 mt-1" size={20} />
                <span className="text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4 bg-dark">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-4xl md:text-5xl text-ivory mb-4">
              Common <span className="gradient-text">Questions</span>
            </h2>
          </div>

          <div className="space-y-6">
            {service.faqs.map((faq, index) => (
              <div
                key={index}
                className="glass-strong rounded-lg p-6 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="text-xl text-gold font-semibold mb-3">{faq.q}</h3>
                <p className="text-gray-300 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-dark-charcoal">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-4xl md:text-5xl text-ivory mb-4">
              Client <span className="gradient-text">Success Stories</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {service.testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="glass-strong rounded-lg p-8 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="text-5xl text-gold/20 mb-4">"</div>
                <p className="text-gray-300 text-lg italic mb-6">{testimonial.text}</p>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-ivory font-semibold">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 px-4 bg-dark">
        <div className="max-w-4xl mx-auto">
          <div className="glass-strong rounded-lg p-12">
            <div className="text-center mb-8">
              <h2 className="font-sans text-4xl md:text-5xl text-ivory mb-4">
                Ready to <span className="gradient-text">Get Started?</span>
              </h2>
              <p className="text-gray-300 text-lg">
                Let's discuss your {service.title.toLowerCase()} needs and create a personalized plan.
              </p>
            </div>
            <ContactForm minimal={true} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServiceDetail;
