import { useEffect, useRef } from 'react';
import { Star, ExternalLink, Shield } from 'lucide-react';

const RATEMYAGENT_PROFILE = 'https://www.ratemyagent.com/real-estate-agent/lorena-ontiveros-ortega-b0zbn5/sales/overview';

const WIDGET_EMBED_CODE = '';

const RateMyAgentReviews = () => {
  const widgetRef = useRef<HTMLDivElement>(null);

  // If widget embed code is provided, inject it
  useEffect(() => {
    if (WIDGET_EMBED_CODE && widgetRef.current) {
      widgetRef.current.innerHTML = WIDGET_EMBED_CODE;

      // Execute any script tags in the widget code
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
    <section className="py-12 sm:py-16 md:py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-extrabold">Verified Reviews</span>
          <h2 className="mt-3 font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black font-bold">
            What My Clients <span className="gradient-text">Say</span>
          </h2>
          <p className="mt-4 text-black/60 max-w-2xl mx-auto font-light text-lg">
            Real reviews from real clients — verified by RateMyAgent
          </p>
        </div>

        {WIDGET_EMBED_CODE ? (
          // Render official RateMyAgent widget
          <div className="max-w-4xl mx-auto">
            <div ref={widgetRef} className="ratemyagent-widget" />
          </div>
        ) : (
          // Profile card with CTA to view reviews on RateMyAgent
          <div className="max-w-4xl mx-auto">
            {/* RateMyAgent Profile Card */}
            <div className="bg-white border border-gray-200 shadow-premium overflow-hidden">
              {/* Top banner */}
              <div className="bg-black p-4 sm:p-6 md:p-8 lg:p-12 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Shield className="text-gold" size={24} />
                  <span className="text-white/80 text-sm uppercase tracking-widest font-bold">Verified Agent</span>
                </div>
                <h3 className="font-playfair text-3xl sm:text-4xl text-white font-bold mb-2">
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
                <p className="text-white/70 text-lg font-light">5.0 Star Rating</p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 border-b border-gray-200">
                <div className="p-6 sm:p-8 text-center border-r border-gray-200">
                  <p className="text-3xl sm:text-4xl font-playfair font-bold text-gold mb-1">40+</p>
                  <p className="text-xs sm:text-sm text-black/60 uppercase tracking-wider font-medium">Sales</p>
                </div>
                <div className="p-6 sm:p-8 text-center border-r border-gray-200">
                  <p className="text-3xl sm:text-4xl font-playfair font-bold text-gold mb-1">5.0</p>
                  <p className="text-xs sm:text-sm text-black/60 uppercase tracking-wider font-medium">Rating</p>
                </div>
                <div className="p-6 sm:p-8 text-center">
                  <p className="text-3xl sm:text-4xl font-playfair font-bold text-gold mb-1">100%</p>
                  <p className="text-xs sm:text-sm text-black/60 uppercase tracking-wider font-medium">Recommended</p>
                </div>
              </div>

              {/* CTA */}
              <div className="p-4 sm:p-6 md:p-8 lg:p-12 text-center">
                <p className="text-black/70 mb-6 font-light text-lg">
                  See all verified reviews and property sales on RateMyAgent
                </p>
                <a
                  href={RATEMYAGENT_PROFILE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gold text-white font-bold uppercase tracking-widest hover:shadow-gold-glow transition-premium text-sm"
                >
                  Read My Reviews
                  <ExternalLink size={16} />
                </a>
                <p className="mt-4 text-black/40 text-xs flex items-center justify-center gap-2">
                  <Shield size={12} />
                  Powered by RateMyAgent — Every review is linked to a verified transaction
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RateMyAgentReviews;
