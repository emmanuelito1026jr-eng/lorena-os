import { AlertTriangle } from 'lucide-react';
import { useMLSSyncStatus } from '../../hooks/useListings';

interface StaleDataBannerProps {
  className?: string;
}

const StaleDataBanner = ({ className = '' }: StaleDataBannerProps) => {
  const { data: syncStatus } = useMLSSyncStatus();

  if (!syncStatus?.isStale) return null;

  const timeLabel = syncStatus.hoursOld > 24
    ? `${Math.floor(syncStatus.hoursOld / 24)} days`
    : `${Math.floor(syncStatus.hoursOld)} hours`;

  return (
    <div className={`bg-yellow-50 border-b border-yellow-200 px-4 py-3 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-800 text-sm font-lato">
        <AlertTriangle size={16} className="shrink-0" />
        <span>
          MLS listing data may be outdated. Last updated {timeLabel} ago.
          Data is provided by GEPAR and refreshes every 15 minutes.
        </span>
      </div>
    </div>
  );
};

export default StaleDataBanner;
