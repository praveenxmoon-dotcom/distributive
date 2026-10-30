interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'critical' | 'high' | 'medium' | 'low';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantMap: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-electric-50 text-electric-700 border-electric-200',
  info: 'bg-electric-50 text-electric-700 border-electric-200',
  neutral: 'bg-navy-50 text-navy-600 border-navy-200',
};

const dotMap: Record<string, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-electric-500',
  info: 'bg-electric-500',
  neutral: 'bg-navy-400',
};

export function Badge({ variant = 'neutral', children, className = '', dot = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${variantMap[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotMap[variant]}`} />}
      {children}
    </span>
  );
}
