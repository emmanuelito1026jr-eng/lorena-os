import type { MLSListing } from './types';

// GEPAR Rule 18.3.12: Only Active and Pending may be shown on public IDX.
// Closed/Expired/Withdrawn/Canceled are prohibited from public display.
// Closed data is allowed ONLY in private dashboard (CMA tool, market stats).
const DISPLAYABLE_STATUSES = ['Active', 'Pending'];

export function isListingDisplayable(listing: MLSListing): boolean {
  if (!listing.InternetEntireListingDisplay) return false;
  if (!listing.InternetAddressDisplay) return false;
  if (!DISPLAYABLE_STATUSES.includes(listing.StandardStatus)) return false;
  return true;
}

export function formatMLSDisclaimer(variant: 'full' | 'compact' = 'full'): string {
  const base = 'Based on information from the Greater El Paso Association of REALTORS\u00AE MLS.';

  if (variant === 'compact') {
    return `${base} Information deemed reliable but not guaranteed.`;
  }

  return `${base} IDX information is provided exclusively for consumers\u2019 personal, non-commercial use, and may not be used for any purpose other than to identify prospective properties consumers may be interested in purchasing. Information Is Believed To Be Accurate But Not Guaranteed. Copyright ${new Date().getFullYear()} Greater El Paso Association of Realtors Multiple Listing Service. All Rights Reserved.`;
}

export function getLastRefreshTimeFormatted(): string {
  const lastRefresh = localStorage.getItem('mlsLastRefresh');
  if (!lastRefresh) return 'Never';

  const date = new Date(lastRefresh);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
