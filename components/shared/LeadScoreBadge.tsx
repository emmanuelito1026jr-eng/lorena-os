import { useState } from 'react';
import type { LeadTemperature } from '../../lib/supabase/database.types';
import { HOT_THRESHOLD, WARM_THRESHOLD, COOL_THRESHOLD } from '../../lib/scoring/constants';
import type { ScoreCategory } from '../../lib/scoring/constants';

interface LeadScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  breakdown?: { category: ScoreCategory; subtotal: number }[];
}

function getTemperature(score: number): LeadTemperature {
  if (score >= HOT_THRESHOLD) return 'hot';
  if (score >= WARM_THRESHOLD) return 'warm';
  if (score >= COOL_THRESHOLD) return 'cool';
  return 'cold';
}

const temperatureConfig: Record<LeadTemperature, { color: string; bg: string; label: string }> = {
  hot: { color: 'text-white', bg: 'bg-score-hot', label: 'Hot' },
  warm: { color: 'text-white', bg: 'bg-score-warm', label: 'Warm' },
  cool: { color: 'text-white', bg: 'bg-score-cool', label: 'Cool' },
  cold: { color: 'text-white', bg: 'bg-score-cold', label: 'Cold' },
};

const sizeConfig = {
  sm: 'h-6 text-xs px-2',
  md: 'h-8 text-sm px-2.5',
  lg: 'h-10 text-sm px-3',
};

const categoryColors: Record<ScoreCategory, string> = {
  Engagement: 'text-blue-600',
  Interest: 'text-purple-600',
  Intent: 'text-green-600',
  Decay: 'text-orange-600',
  Risk: 'text-red-600',
};

export function LeadScoreBadge({ score, size = 'md', showLabel = false, breakdown }: LeadScoreBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const temp = getTemperature(score);
  const { color, bg, label } = temperatureConfig[temp];
  const sizeClass = sizeConfig[size];

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`inline-flex items-center gap-1 rounded-full font-lato font-medium ${bg} ${color} ${sizeClass}`}
      >
        <span>{score}</span>
        {showLabel && <span className="hidden sm:inline">{label}</span>}
      </span>

      {/* Score breakdown tooltip */}
      {showTooltip && breakdown && breakdown.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg border border-dashboard-border p-2.5 min-w-[160px]">
            <p className="font-lato text-[10px] font-bold text-dashboard-secondary uppercase tracking-wide mb-1.5">
              Score Breakdown
            </p>
            <div className="space-y-1">
              {breakdown.map((item) => (
                <div key={item.category} className="flex items-center justify-between gap-3">
                  <span className={`font-lato text-xs ${categoryColors[item.category]}`}>
                    {item.category}
                  </span>
                  <span className={`font-lato text-xs font-bold ${item.subtotal >= 0 ? 'text-dashboard-black' : 'text-red-500'}`}>
                    {item.subtotal >= 0 ? '+' : ''}{item.subtotal}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-dashboard-border flex items-center justify-between">
              <span className="font-lato text-xs font-bold text-dashboard-black">Total</span>
              <span className={`font-lato text-xs font-bold ${color} ${bg} px-1.5 py-0.5 rounded-full`}>{score}</span>
            </div>
          </div>
          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-white border-r border-b border-dashboard-border rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </span>
  );
}
