import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Gold accent circle with icon */}
      <div className="w-16 h-16 rounded-full bg-dashboard-gold/10 flex items-center justify-center mb-5">
        <Icon size={28} className="text-dashboard-gold" />
      </div>

      <h3 className="font-playfair text-xl font-semibold text-dashboard-black mb-2">
        {title}
      </h3>

      <p className="font-lato text-sm text-dashboard-secondary max-w-sm mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
