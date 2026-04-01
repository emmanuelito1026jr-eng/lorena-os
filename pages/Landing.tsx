import { PHONE_NUMBER } from '../constants';
import ContactForm from '../components/ContactForm';
import { Star, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

const Landing  = () => {
  usePageTitle('Free Home Valuation');
  return (
    <div className="bg-black min-h-screen flex flex-col">
      {/* Minimal Header */}
      <div className="absolute top-0 w-full p-6 z-20 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <Link to="/" className="font-playfair text-xl font-bold text-white">
           CASAS EN <span className="text-gold">EL PASO</span>
        </Link>
        <div className="text-white text-sm font-bold hidden sm:block">
            Call: <a href={`tel:${PHONE_NUMBER}`} className="text-gold hover:underline">{PHONE_NUMBER}</a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 flex-grow">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img src="/images/hero/el-paso-cityscape.jpg" alt="Luxury home in El Paso" width={1920} height={1080} className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-dark/60"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-6">
                <div className="inline-block bg-gold/20 text-gold px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm border border-gold/20">
                    Bilingual Real Estate Services
                </div>
                <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-white leading-tight font-bold">
                    Find Your Perfect El Paso Home <span className="text-gold italic">— Before Everyone Else.</span>
                </h1>
                <p className="text-xl text-white/80 leading-relaxed max-w-lg">
                    Get exclusive access to new listings, price drops, and off-market homes delivered straight to your inbox.
                </p>
                
                {/* Value Props */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-gold shrink-0" size={20} />
                        <span className="text-gray-200">Off-Market Listings Access</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-gold shrink-0" size={20} />
                        <span className="text-gray-200">10+ Years Banking & Financial Experience</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-gold shrink-0" size={20} />
                        <span className="text-gray-200">Fully Bilingual (English/Spanish)</span>
                    </div>
                </div>

                {/* Social Proof Strip */}
                <div className="pt-8 flex items-center gap-4">
                    <div className="flex -space-x-3">
                        <div className="w-10 h-10 rounded-full border-2 border-dark bg-gold flex items-center justify-center text-white font-bold text-sm">F</div>
                        <div className="w-10 h-10 rounded-full border-2 border-dark bg-gold/80 flex items-center justify-center text-white font-bold text-sm">M</div>
                        <div className="w-10 h-10 rounded-full border-2 border-dark bg-gold/60 flex items-center justify-center text-white font-bold text-sm">E</div>
                    </div>
                    <div>
                        <div className="flex text-gold">
                            {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                        </div>
                        <p className="text-xs text-white/60 mt-1">Trusted by 100+ El Paso Families</p>
                    </div>
                </div>
            </div>

            {/* Right Form */}
            <div className="bg-white border border-gold/30 p-8 rounded-lg shadow-2xl relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gold text-dark font-bold text-xs uppercase px-4 py-1 tracking-widest whitespace-nowrap">
                    Limited Time Consultation
                </div>
                <h3 className="font-playfair text-2xl text-center text-black mb-2">Get Exclusive Access</h3>
                <p className="text-black/60 text-center text-sm mb-6">Complete the form below to start your search.</p>
                <ContactForm minimal={true} />
            </div>
        </div>
      </section>

      {/* Urgency Section */}
      <section className="bg-gold text-dark py-6 text-center">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 font-bold text-sm md:text-base">
            <span>🔥 El Paso Market Update:</span>
            <span className="font-normal">Homes are selling fast. Don't miss out on your dream home.</span>
        </div>
      </section>

      {/* Footer Minimal */}
      <footer className="bg-black py-8 text-center text-gray-600 text-xs">
         <p className="mb-2">&copy; {new Date().getFullYear()} Casas En El Paso TX | Realty ONE Group</p>
         <div className="flex justify-center gap-4">
             <a href="https://www.trec.texas.gov/forms/consumer-protection-notice" target="_blank" rel="noopener noreferrer" className="underline">TREC Consumer Protection Notice</a>
             <a href="https://www.trec.texas.gov/forms/information-about-brokerage-services" target="_blank" rel="noopener noreferrer" className="underline">TREC Information About Brokerage Services</a>
         </div>
      </footer>
    </div>
  );
};

export default Landing;