import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  title?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-electric-600 text-white border-electric-700/20 hover:bg-electric-700 hover:shadow-glass active:scale-[0.98]',
  secondary: 'bg-white/70 text-navy-700 border-white/80 hover:bg-white/90 hover:border-electric-200 active:scale-[0.98]',
  ghost: 'bg-transparent text-navy-600 border-transparent hover:bg-white/60 hover:text-navy-800 active:scale-[0.98]',
  danger: 'bg-red-500/90 text-white border-red-600/20 hover:bg-red-600 active:scale-[0.98]',
  success: 'bg-emerald-500/90 text-white border-emerald-600/20 hover:bg-emerald-600 active:scale-[0.98]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
  md: 'text-sm px-4 py-2 gap-2 rounded-xl',
  lg: 'text-sm px-5 py-2.5 gap-2 rounded-xl',
};

export function Button({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  icon,
  className = '',
  type = 'button',
  title,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center font-medium border transition-all duration-200
        ${variantClasses[variant]} ${sizeClasses[size]}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
