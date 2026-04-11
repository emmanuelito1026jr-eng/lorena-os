/**
 * GEPAR MLS Compliance Disclosure
 * Required by GEPAR MLS Rules Section 5.0.0 and 5.0.1
 * Must appear on ALL IDX property display pages
 */

interface GEPARDisclosureProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function GEPARDisclosure({ variant = 'compact', className = '' }: GEPARDisclosureProps) {
  if (variant === 'compact') {
    return (
      <div className={`text-xs text-gray-500 border-t border-gray-100 pt-3 mt-4 ${className}`}>
        <p className="leading-relaxed">
          <span className="font-medium">Consumer Notice:</span>{' '}
          All real estate information is deemed reliable but not guaranteed. Properties are subject to
          prior sale, change, or withdrawal. Lorena Ontiveros-Ortega is a licensed Texas REALTOR®
          and member of GEPAR MLS. A written buyer agreement is required before touring properties.{' '}
          <span className="font-medium">Equal Housing Opportunity.</span>
        </p>
        <p className="mt-1">
          IDX information © {new Date().getFullYear()} Greater El Paso Association of REALTORS® (GEPAR).
          All rights reserved. Data last updated: {new Date().toLocaleDateString()}.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 ${className}`}>
      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
        <span>⚖️</span> Required Disclosures
      </h4>
      <div className="space-y-2">
        <p>
          <strong>Consumer Notice (GEPAR Rule 5.0.0):</strong> All real estate information on this
          site is provided for consumers' personal, non-commercial use and may not be used for any
          purpose other than to identify prospective properties consumers may be interested in
          purchasing. All information is deemed reliable but not guaranteed accurate.
        </p>
        <p>
          <strong>Buyer Agreement (GEPAR Rule 5.0.1):</strong> A signed written buyer agreement is
          required prior to touring any property. Contact Lorena Ontiveros-Ortega at
          915-487-5581 to complete your buyer agreement.
        </p>
        <p>
          <strong>IDX Data:</strong> © {new Date().getFullYear()} Greater El Paso Association of
          REALTORS® (GEPAR). IDX information is provided exclusively for consumers' personal,
          non-commercial use. Properties displayed may be listed or sold by various participants
          in the MLS. Data last updated: {new Date().toLocaleString()}.
        </p>
        <p className="font-medium text-center mt-3">
          🏠 Equal Housing Opportunity | Texas REALTORS® License #
        </p>
      </div>
    </div>
  );
}

export default GEPARDisclosure;
