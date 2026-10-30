import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GlassCard, DemoBadge, Tooltip } from '@/components/ui/GlassCard';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { direction: 'up' | 'down' | 'neutral'; value: string };
  trendLabel?: string;
  accent: 'electric' | 'amber' | 'emerald' | 'rose';
  tooltip?: string;
}

const accentMap = {
  electric: { bg: 'bg-electric-50', border: 'border-electric-100', text: 'text-electric-600', iconBg: 'bg-electric-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', iconBg: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-500' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', iconBg: 'bg-rose-500' },
};

export function KPICard({ label, value, icon, trend, trendLabel, accent, tooltip }: KPICardProps) {
  const a = accentMap[accent];
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;

  return (
    <GlassCard className="p-5 animate-slide-up relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${a.bg} opacity-50 blur-2xl -mr-8 -mt-8`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${a.bg} ${a.border} border flex items-center justify-center ${a.text}`}>
            {icon}
          </div>
          <DemoBadge />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-navy-900 tabular-nums">{value}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-medium text-navy-500">
            {label}
            {tooltip && (
              <Tooltip text={tooltip}>
                <span className="ml-1 text-navy-300 cursor-help underline decoration-dotted">?</span>
              </Tooltip>
            )}
          </span>
          {trend && (
            <div className="flex items-center gap-1">
              <TrendIcon size={13} className={trend.direction === 'up' ? 'text-rose-500' : trend.direction === 'down' ? 'text-emerald-500' : 'text-navy-400'} />
              <span className="text-xs font-semibold text-navy-600">{trend.value}</span>
            </div>
          )}
        </div>
        {trendLabel && <p className="text-xs text-navy-400 mt-0.5">{trendLabel}</p>}
      </div>
    </GlassCard>
  );
}
