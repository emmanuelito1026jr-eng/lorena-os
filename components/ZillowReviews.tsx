import { useEffect, useRef } from 'react';
import { Star, ExternalLink, Shield, Building2 } from 'lucide-react';

const ZILLOW_PROFILE = 'https://www.zillow.com/profile/lorena%20realtor6';

// TODO: Replace with Zillow widget embed code if available
const WIDGET_EMBED_CODE = '';

const ZillowReviews = () => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (WIDGET_EMBED_CODE && widgetRef.current) {
      widgetRef.current.innerHTML = WIDGET_EMBED_CODE;

      const scripts = widgetRef.current.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, []);

  return (
    <section className="py-12 sm:py-16 md:py-24 lg:py-32 bg-gray-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-extrabold">Trusted Platform</span>
          <h2 className="mt-3 font-sans text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black font-bold">
            Zillow <span className="gradient-text">Reviews</span>
          </h2>
          <p className="mt-4 text-black/60 max-w-2xl mx-auto font-light text-lg">
            See what my clients say on Zillow's trusted real estate platform
          </p>
        </div>

        {WIDGET_EMBED_CODE ? (
          <div className="max-w-4xl mx-auto">
            <div ref={widgetRef} className="zillow-widget" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 shadow-premium overflow-hidden">
              {/* Top Banner */}
              <div className="bg-black p-4 sm:p-6 md:p-8 lg:p-12 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Building2 className="text-gold" size={24} />
                  <span className="text-white/80 text-sm uppercase tracking-widest font-bold">Zillow Premier Agent</span>
                </div>
                <h3 className="font-sans text-3xl sm:text-4xl text-white font-bold mb-2">
                  Lorena Ontiveros-Ortega
                </h3>
                <p className="text-gold text-sm uppercase tracking-widest font-extrabold mb-6">
                  The Right Move Real Estate Group
                </p>

                {/* Star Rating */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={28} className="text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-white/70 text-lg font-light">5.0 Star Rating on Zillow</p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 border-b border-gray-200">
                <div className="p-6 sm:p-8 text-center border-r border-gray-200">
                  <p className="text-3xl sm:text-4xl font-sans font-bold text-gold mb-1">15+</p>
                  <p className="text-xs sm:text-sm text-black/60 uppercase tracking-wider font-medium">Reviews</p>
                </div>
                <div className="p-6 sm:p-8 text-center border-r border-gray-200">
                  <p className="text-3xl sm:text-4xl font-sans font-bold text-gold mb-1">5.0</p>
                  <p className="text-xs sm:text-sm text-black/60 uppercase tracking-wider font-medium">Rating</p>
                </div>
                <div className="p-6 sm:p-8 text-center">
                  <p className="text-3xl sm:text-4xl font-sans font-bold text-gold mb-1">100%</p>
                  <p className="text-xs sm:text-sm text-black/60 uppercase tracking-wider font-medium">Recommended</p>
                </div>
              </div>

              {/* CTA */}
              <div className="p-4 sm:p-6 md:p-8 lg:p-12 text-center">
                <p className="text-black/70 mb-6 font-light text-lg">
                  Read verified reviews from my clients on Zillow
                </p>
                <a
                  href={ZILLOW_PROFILE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gold text-white font-bold uppercase tracking-widest hover:shadow-gold-glow transition-premium text-sm"
                >
                  View Zillow Reviews
                  <ExternalLink size={16} />
                </a>
                <p className="mt-4 text-black/40 text-xs flex items-center justify-center gap-2">
                  <Shield size={12} />
                  Powered by Zillow — Verified Reviews from Real Clients
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ZillowReviews;
