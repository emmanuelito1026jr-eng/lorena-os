import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { REALTOR_NAME, EMAIL_ADDRESS, BROKERAGE, ADDRESS } from '../constants';

const DMCA = () => {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-extrabold">Legal</span>
          <h1 className="mt-2 font-sans text-4xl md:text-5xl text-black font-bold mb-8">
            DMCA Notice
          </h1>

          <div className="bg-white border border-gray-200 rounded-lg p-8 md:p-12 space-y-8 text-black/80 leading-relaxed">
            <div>
              <h2 className="text-2xl font-sans text-gold mb-3">
                Digital Millennium Copyright Act Policy
              </h2>
              <p>
                {BROKERAGE} respects the intellectual property rights of others and expects
                users of this website to do the same. In accordance with the Digital Millennium
                Copyright Act of 1998 (&ldquo;DMCA&rdquo;), we will respond promptly to claims of
                copyright infringement committed using our website.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">Filing a DMCA Takedown Notice</h3>
              <p className="mb-3">
                If you believe that content on our website infringes your copyright, please provide
                a written notification containing the following information:
              </p>
              <ol className="list-decimal list-inside ml-4 space-y-2">
                <li>A physical or electronic signature of the copyright owner or authorized agent</li>
                <li>Identification of the copyrighted work claimed to have been infringed</li>
                <li>Identification of the material that is claimed to be infringing, including the URL</li>
                <li>Your contact information (address, telephone number, and email address)</li>
                <li>A statement that you have a good faith belief that the use is not authorized</li>
                <li>A statement, under penalty of perjury, that the information is accurate and you are authorized to act on behalf of the copyright owner</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">Designated Agent</h3>
              <div className="bg-gold/5 border-l-4 border-gold p-6">
                <p className="font-medium text-black">{REALTOR_NAME}</p>
                <p className="text-black/70">{BROKERAGE}</p>
                <p className="text-black/70">{ADDRESS}</p>
                <p className="text-black/70 mt-2">
                  Email:{' '}
                  <a href={`mailto:${EMAIL_ADDRESS}`} className="text-gold hover:underline">
                    {EMAIL_ADDRESS}
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">Counter-Notification</h3>
              <p className="mb-3">
                If you believe that material was removed or disabled by mistake or
                misidentification, you may file a counter-notification containing:
              </p>
              <ol className="list-decimal list-inside ml-4 space-y-2">
                <li>Your physical or electronic signature</li>
                <li>Identification of the material that was removed and its prior location</li>
                <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</li>
                <li>Your name, address, and telephone number</li>
                <li>Consent to the jurisdiction of the federal court in your district</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">MLS Content</h3>
              <p>
                Property listing photographs and descriptions are provided by the Greater El Paso
                Association of REALTORS&reg; MLS and are displayed under IDX license. Copyright
                claims related to MLS content should also be directed to the Greater El Paso
                Association of REALTORS&reg;.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-sans text-black mb-2">Repeat Infringers</h3>
              <p>
                In accordance with the DMCA, we will terminate access for users who are
                determined to be repeat infringers in appropriate circumstances.
              </p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-xs text-black/40">Last Updated: February 12, 2026</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DMCA;
