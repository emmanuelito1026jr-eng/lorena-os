import { BUSINESS_EMAIL } from '../../constants';

interface IDXComplianceProps {
  variant?: 'full' | 'compact';
  showLogo?: boolean;
  className?: string;
}

const currentYear = new Date().getFullYear();

const IDXCompliance = ({
  variant = 'full',
  showLogo = true,
  className = '',
}: IDXComplianceProps) => {
  if (variant === 'compact') {
    return (
      <div className={`text-xs text-black/50 ${className}`}>
        <p>
          &copy; {currentYear} Greater El Paso Association of REALTORS&reg;.
          Information deemed reliable but not guaranteed.
        </p>
      </div>
    );
  }

  return (
    <section className={`py-12 px-4 bg-white border-t border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto text-center space-y-4">
        {showLogo && (
          <div className="flex justify-center mb-6">
            <img
              src="/images/logo/greater-el-paso-realtors.jpg"
              alt="Greater El Paso Association of REALTORS®"
              className="h-16 w-auto"
              loading="lazy"
            />
          </div>
        )}

        {/* Agent & Broker Info — GEPAR Section 18 */}
        <p className="text-sm text-black/70 font-lato">
          Lorena Ontiveros-Ortega &nbsp;|&nbsp; The Right Move Real Estate Group LLC &nbsp;|&nbsp; Licensed in Texas
        </p>

        {/* MLS Data Source & Date Period */}
        <p className="text-xs text-black/60 font-lato leading-relaxed max-w-4xl mx-auto">
          Based on information from the Greater El Paso Association of REALTORS&reg;
          Multiple Listing Service. IDX information is provided exclusively for
          consumers&rsquo; personal, non-commercial use, and may not be used for
          any purpose other than to identify prospective properties consumers may
          be interested in purchasing. Information is believed to be accurate but
          not guaranteed.
        </p>

        {/* Copyright */}
        <p className="text-xs text-black/40 font-lato">
          &copy; {currentYear} Greater El Paso Association of REALTORS&reg;. All rights reserved.
        </p>

        {/* Report Link */}
        <p className="text-xs">
          <a
            href={`mailto:${BUSINESS_EMAIL}?subject=Inaccurate%20Listing%20Data`}
            className="text-gold hover:underline font-lato"
          >
            Report inaccurate listing data
          </a>
        </p>
      </div>
    </section>
  );
};

export default IDXCompliance;
