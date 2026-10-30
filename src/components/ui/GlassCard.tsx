import { type ReactNode, forwardRef } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', hover = false, onClick }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`glass rounded-2xl ${hover ? 'glass-hover cursor-pointer' : ''} ${className}`}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-electric-50 border border-electric-100 flex items-center justify-center text-electric-600 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-navy-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-navy-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2
                       px-2.5 py-1.5 text-xs font-medium text-white bg-navy-900/95 backdrop-blur-sm
                       rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100
                       transition-opacity duration-200 z-50 shadow-glass-lg max-w-xs">
        {text}
      </span>
    </span>
  );
}

interface DemoBadgeProps {
  className?: string;
}

export function DemoBadge({ className = '' }: DemoBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider
      bg-amber-50 text-amber-700 border border-amber-200 rounded-md ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-soft" />
      Simulated
    </span>
  );
}
