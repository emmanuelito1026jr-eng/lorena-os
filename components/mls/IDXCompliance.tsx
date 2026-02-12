import { formatMLSDisclaimer } from '../../lib/mls/compliance';
import { formatLastRefresh } from '../../lib/mls/dataRefresh';

interface IDXComplianceProps {
  variant?: 'full' | 'compact';
  showLogo?: boolean;
  className?: string;
}

const IDXCompliance = ({
  variant = 'full',
  showLogo = true,
  className = '',
}: IDXComplianceProps) => {
  const disclaimer = formatMLSDisclaimer(variant);
  const lastUpdated = formatLastRefresh();

  if (variant === 'compact') {
    return (
      <div className={`text-xs text-black/50 ${className}`}>
        <p>{disclaimer}</p>
        <p className="mt-1">{lastUpdated}</p>
      </div>
    );
  }

  return (
    <section className={`py-12 px-4 bg-white border-t border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto">
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
        <p className="text-xs text-black/60 font-lato leading-relaxed text-center max-w-4xl mx-auto">
          {disclaimer}
        </p>
        <p className="text-xs text-black/40 font-lato text-center mt-3">
          {lastUpdated}
        </p>
      </div>
    </section>
  );
};

export default IDXCompliance;
