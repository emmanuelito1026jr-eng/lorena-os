import { Building } from 'lucide-react';
import { BUSINESS_EMAIL } from '../../constants';

interface ListingAttributionProps {
  officeName: string;
  agentName: string;
  agentEmail?: string;
  agentPhone?: string;
  mlsNumber: string;
  lastUpdated?: string;
  variant?: 'card' | 'detail';
  className?: string;
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return ts;
  }
}

const ListingAttribution = ({
  officeName,
  agentName,
  agentEmail,
  agentPhone,
  mlsNumber,
  lastUpdated,
  variant = 'card',
  className = '',
}: ListingAttributionProps) => {
  if (variant === 'detail') {
    return (
      <div className={`bg-gold/5 border-l-4 border-gold p-6 space-y-4 ${className}`}>
        <h3 className="text-sm uppercase tracking-widest text-gold font-bold">
          Listing Information
        </h3>

        {/* Firm & Agent — GEPAR Section 18.2.12: font NOT smaller than median */}
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-black/60">Listing courtesy of</span>
            <span className="ml-1 text-black font-semibold">{officeName}</span>
          </div>
          <div>
            <span className="text-black/60">Listing agent:</span>
            <span className="ml-1 text-black font-medium">{agentName}</span>
            {(agentEmail || agentPhone) && (
              <span className="ml-1 text-black/70">
                | {agentEmail || agentPhone}
              </span>
            )}
          </div>
          <div>
            <span className="text-black/60">MLS#</span>
            <span className="ml-1 font-mono text-black">{mlsNumber}</span>
          </div>
        </div>

        {/* MLS Source & Disclaimer */}
        <div className="border-t border-gold/20 pt-4 space-y-3 text-xs text-black/55 leading-relaxed">
          <p>
            Data &copy; Greater El Paso Association of REALTORS&reg;. IDX
            information provided by Spark Platform. Information deemed reliable
            but not guaranteed.
          </p>
          <p>
            IDX information is provided exclusively for consumers&rsquo;
            personal, non-commercial use. It may not be used for any purpose
            other than to identify prospective properties consumers may be
            interested in purchasing.
          </p>
          {lastUpdated && (
            <p className="text-black/40">
              Data last updated: {formatTimestamp(lastUpdated)}
            </p>
          )}
          <p>
            <a
              href={`mailto:${BUSINESS_EMAIL}?subject=Inaccurate%20Listing%20Data`}
              className="text-gold hover:underline"
            >
              Report inaccurate listing data
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Card variant — compact attribution for grid cards
  // GEPAR Rule 18.2.12: Font size NOT smaller than median used in the display (text-sm = 14px)
  return (
    <div className={`mt-3 pt-3 border-t border-gray-100 ${className}`}>
      <div className="flex items-start gap-2 text-sm text-black/60">
        <Building size={14} className="text-gold mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium text-black/70">Courtesy of {officeName}</p>
          <p>{agentName}{agentEmail ? ` | ${agentEmail}` : agentPhone ? ` | ${agentPhone}` : ''}</p>
          <p className="font-mono text-xs text-black/40 mt-0.5">MLS# {mlsNumber}</p>
        </div>
      </div>
    </div>
  );
};

export default ListingAttribution;
