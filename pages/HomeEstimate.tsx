import { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Home, MapPin, Bed, Bath, Maximize, Calendar } from 'lucide-react';

const HomeEstimate = () => {
  const [formData, setFormData] = useState({
    address: '',
    bedrooms: '3',
    bathrooms: '2',
    squareFeet: '1500',
    yearBuilt: '2000',
    condition: 'Good' as 'Excellent' | 'Good' | 'Fair' | 'Needs Work',
    name: '',
    email: '',
    phone: '',
  });

  const [submitted, setSubmitted] = useState(false);

  // Simple estimation algorithm
  const estimatedValue = useMemo(() => {
    const basePricePerSqFt = 150; // El Paso average
    const sqft = parseInt(formData.squareFeet) || 0;
    const age = 2026 - parseInt(formData.yearBuilt);

    let baseValue = sqft * basePricePerSqFt;

    // Condition adjustments
    const conditionMultiplier = {
      'Excellent': 1.15,
      'Good': 1.0,
      'Fair': 0.9,
      'Needs Work': 0.75
    };
    baseValue *= conditionMultiplier[formData.condition];

    // Age adjustments
    if (age < 5) baseValue *= 1.1;
    else if (age > 30) baseValue *= 0.9;

    return Math.round(baseValue / 1000) * 1000; // Round to nearest $1000
  }, [formData.squareFeet, formData.yearBuilt, formData.condition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedValue,
          type: 'Home Estimate',
          timestamp: new Date().toISOString(),
          source: 'home-estimate-page'
        })
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-br from-dark to-dark-100">
        <div className="max-w-7xl mx-auto text-center">
          <Home className="text-gold mx-auto mb-6" size={64} />
          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-gold mb-6">
            Free Home Estimate
          </h1>
          <p className="font-lato text-lg md:text-xl text-warm-white max-w-2xl mx-auto">
            Get an instant estimate of your home's value in El Paso, Texas
          </p>
        </div>
      </section>

      {/* Estimate Form */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white shadow-premium border border-gray-200 rounded-lg p-8 md:p-12">
            {!submitted ? (
              <>
                <h2 className="font-playfair text-3xl text-dark mb-8">Property Details</h2>

                {/* Address */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                    <MapPin size={16} className="text-gold" />
                    Property Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-premium font-lato"
                    placeholder="123 Main St, El Paso, TX 79901"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Bedrooms */}
                  <div>
                    <label className="flex items-center gap-2 text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                      <Bed size={16} className="text-gold" />
                      Bedrooms
                    </label>
                    <select
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-premium font-lato"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <label className="flex items-center gap-2 text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                      <Bath size={16} className="text-gold" />
                      Bathrooms
                    </label>
                    <select
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-premium font-lato"
                    >
                      {['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5'].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  {/* Square Feet */}
                  <div>
                    <label className="flex items-center gap-2 text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                      <Maximize size={16} className="text-gold" />
                      Square Feet
                    </label>
                    <input
                      type="number"
                      name="squareFeet"
                      value={formData.squareFeet}
                      onChange={handleChange}
                      required
                      min="500"
                      max="10000"
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-premium font-lato"
                    />
                  </div>

                  {/* Year Built */}
                  <div>
                    <label className="flex items-center gap-2 text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2">
                      <Calendar size={16} className="text-gold" />
                      Year Built
                    </label>
                    <input
                      type="number"
                      name="yearBuilt"
                      value={formData.yearBuilt}
                      onChange={handleChange}
                      required
                      min="1900"
                      max="2026"
                      className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-premium font-lato"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div className="mb-8">
                  <label className="text-dark/80 text-sm uppercase tracking-wider font-lato font-semibold mb-2 block">
                    Property Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-premium font-lato"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Work">Needs Work</option>
                  </select>
                </div>

                {/* Estimated Value Display */}
                {estimatedValue > 0 && (
                  <div className="mb-8 p-8 bg-gradient-to-br from-gold/10 to-gold/5 border-2 border-gold rounded-lg text-center">
                    <p className="text-dark/60 text-sm uppercase tracking-wider font-lato mb-2">Estimated Value</p>
                    <p className="font-playfair text-5xl font-bold text-dark">
                      ${estimatedValue.toLocaleString()}
                    </p>
                    <p className="text-dark/50 text-xs font-lato mt-2">*This is a preliminary estimate. Contact us for a professional valuation.</p>
                  </div>
                )}

                <h2 className="font-playfair text-3xl text-dark mb-8 mt-12">Your Information</h2>

                {/* Contact Fields */}
                <div className="space-y-6 mb-8">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Full Name"
                    className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-premium font-lato"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Email Address"
                    className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-premium font-lato"
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="Phone Number"
                    className="w-full px-4 py-3 border border-gray-200 rounded focus:border-gold focus:outline-none transition-premium font-lato"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-gold text-dark font-lato font-bold uppercase tracking-widest hover:shadow-gold-glow transition-premium"
                >
                  Get Detailed Estimate
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-6">✓</div>
                <h2 className="font-playfair text-3xl text-dark mb-4">Thank You!</h2>
                <p className="font-lato text-dark/70">
                  We've received your home estimate request. Lorena will contact you within 24 hours with a detailed valuation.
                </p>
              </div>
            )}
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomeEstimate;
