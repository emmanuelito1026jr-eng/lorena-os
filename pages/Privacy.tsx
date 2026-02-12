import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { REALTOR_NAME, EMAIL_ADDRESS, BROKERAGE, ADDRESS } from '../constants';

const Privacy = () => {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-extrabold">Legal</span>
          <h1 className="mt-2 font-sans text-4xl md:text-5xl text-black font-bold mb-8">
            Privacy Policy
          </h1>

          <div className="bg-white border border-gray-200 rounded-lg p-8 md:p-12 space-y-8 text-black/80 leading-relaxed">
            <div>
              <h2 className="text-2xl font-sans text-gold mb-3">Your Privacy Matters</h2>
              <p>
                {BROKERAGE} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting
                your privacy. This policy describes how we collect, use, and share information
                when you use our website and services.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">1. Information We Collect</h3>
              <p className="mb-2">We may collect the following types of information:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Contact information:</strong> Name, email, phone number when you submit a contact form</li>
                <li><strong>Property preferences:</strong> Search criteria, saved properties, and viewing history</li>
                <li><strong>Device information:</strong> Browser type, operating system, and IP address</li>
                <li><strong>Usage data:</strong> Pages visited, time spent on site, and interaction patterns</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">2. How We Use Your Information</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>To respond to your property inquiries</li>
                <li>To provide personalized property recommendations</li>
                <li>To improve our website and services</li>
                <li>To comply with MLS rules and regulations</li>
                <li>To maintain audit trails as required by the Greater El Paso Association of REALTORS&reg;</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">3. MLS Data</h3>
              <p>
                Property listing data is provided by the Greater El Paso Association of REALTORS&reg;
                Multiple Listing Service. This data is displayed in accordance with IDX rules and
                is used solely to help consumers identify properties of interest. We do not sell
                or share MLS data with third parties for marketing purposes.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">4. Cookies and Tracking</h3>
              <p>
                We use cookies and similar technologies to improve your browsing experience,
                remember your preferences, and analyze website traffic. You can control cookie
                settings through your browser preferences.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">5. Data Sharing</h3>
              <p>We do not sell your personal information. We may share information with:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Service providers who assist in operating our website</li>
                <li>The Greater El Paso Association of REALTORS&reg; as required by MLS rules</li>
                <li>Law enforcement when required by law</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">6. Data Security</h3>
              <p>
                We implement reasonable security measures to protect your information.
                However, no method of transmission over the Internet is 100% secure.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">7. Your Rights</h3>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">8. Changes to This Policy</h3>
              <p>
                We may update this privacy policy from time to time. Changes will be posted
                on this page with an updated revision date.
              </p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-black/60">
                For privacy-related inquiries, contact {REALTOR_NAME} at{' '}
                <a href={`mailto:${EMAIL_ADDRESS}`} className="text-gold hover:underline">
                  {EMAIL_ADDRESS}
                </a>
              </p>
              <p className="text-sm text-black/60 mt-2">{BROKERAGE} &mdash; {ADDRESS}</p>
              <p className="text-xs text-black/40 mt-4">Last Updated: February 12, 2026</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
