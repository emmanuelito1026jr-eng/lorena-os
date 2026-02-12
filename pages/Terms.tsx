import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { REALTOR_NAME, EMAIL_ADDRESS, BROKERAGE } from '../constants';

const Terms = () => {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-extrabold">Legal</span>
          <h1 className="mt-2 font-sans text-4xl md:text-5xl text-black font-bold mb-8">
            Terms of Use
          </h1>

          <div className="bg-white border border-gray-200 rounded-lg p-8 md:p-12 space-y-8 text-black/80 leading-relaxed">
            <div>
              <h2 className="text-2xl font-sans text-gold mb-3">MLS IDX Data Usage Agreement</h2>
              <p>
                This website displays property listings from the Greater El Paso Association
                of REALTORS&reg; Multiple Listing Service (MLS). By accessing and using this
                website, you agree to the following terms and conditions:
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">1. Personal Use Only</h3>
              <p>
                The MLS data provided on this site is for your personal, non-commercial use only.
                You may not use this data for any commercial purpose, including but not limited to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Competing real estate services</li>
                <li>Data aggregation or scraping</li>
                <li>Mass marketing or solicitation</li>
                <li>Creating derivative databases</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">2. Data Accuracy Disclaimer</h3>
              <p>
                All information is believed to be accurate but is not guaranteed. Properties may
                be sold, withdrawn, or changed without notice. The listing broker and MLS are not
                responsible for any errors or omissions in the data. Buyers should independently
                verify all information before making purchasing decisions.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">3. Copyright Protection</h3>
              <p>
                All MLS data, photographs, and content are protected by copyright.
                Copyright &copy; 2026 Greater El Paso Association of REALTORS&reg; Multiple Listing Service.
                All Rights Reserved. Unauthorized use, reproduction, or distribution is strictly prohibited.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">4. No Scraping or Automated Access</h3>
              <p>
                You may not use any automated means (bots, scrapers, crawlers) to access, collect,
                or copy data from this website. Violations will result in immediate termination of
                access and potential legal action.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">5. Listing Attribution</h3>
              <p>
                All property listings display the listing office and agent information as required
                by MLS rules. This attribution must not be removed, altered, or obscured.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">6. Data Refresh and Currency</h3>
              <p>
                MLS data is refreshed at least every 12 hours as required by the Greater El Paso
                Association of REALTORS&reg;. However, data may not reflect the most current status
                of a property. Properties may sell, change price, or be withdrawn at any time.
                Contact the listing agent for the most current information.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">7. Third-Party Links</h3>
              <p>
                This website may contain links to third-party websites. We are not responsible
                for the content, accuracy, or practices of these external sites.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">8. Changes to Terms</h3>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the
                website constitutes acceptance of updated terms.
              </p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-black/60">
                Questions about these terms? Contact {REALTOR_NAME} at{' '}
                <a href={`mailto:${EMAIL_ADDRESS}`} className="text-gold hover:underline">
                  {EMAIL_ADDRESS}
                </a>
              </p>
              <p className="text-sm text-black/60 mt-2">{BROKERAGE}</p>
              <p className="text-xs text-black/40 mt-4">Last Updated: February 12, 2026</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
