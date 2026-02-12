import { Building } from 'lucide-react';

interface ListingAttributionProps {
  officeName: string;
  agentName: string;
  mlsNumber: string;
  variant?: 'card' | 'detail';
  className?: string;
}

const ListingAttribution = ({
  officeName,
  agentName,
  mlsNumber,
  variant = 'card',
  className = '',
}: ListingAttributionProps) => {
  if (variant === 'detail') {
    return (
      <div className={`bg-gold/5 border-l-4 border-gold p-6 ${className}`}>
        <h3 className="text-sm uppercase tracking-widest text-gold font-bold mb-3">
          Listing Information
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-black/60">Office:</span>
            <span className="ml-2 text-black font-medium">{officeName}</span>
          </div>
          <div>
            <span className="text-black/60">Agent:</span>
            <span className="ml-2 text-black font-medium">{agentName}</span>
          </div>
          <div>
            <span className="text-black/60">MLS Number:</span>
            <span className="ml-2 font-mono text-black">{mlsNumber}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-3 pt-3 border-t border-gray-100 ${className}`}>
      <div className="flex items-start gap-2 text-xs text-black/60">
        <Building size={12} className="text-gold mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium text-black/70">{officeName}</p>
          <p>{agentName}</p>
          <p className="font-mono text-[10px] text-black/40 mt-0.5">MLS# {mlsNumber}</p>
        </div>
      </div>
    </div>
  );
};

export default ListingAttribution;
