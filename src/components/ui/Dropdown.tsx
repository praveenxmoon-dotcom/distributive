import { type ReactNode, useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: ReactNode;
  children: ((close: () => void) => ReactNode) | ReactNode;
  align?: 'left' | 'right';
  width?: string;
}

export function Dropdown({ trigger, children, align = 'right', width = 'w-72' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="block"
      >
        {trigger}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} />
          <div className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} ${width} z-40
            bg-white/90 backdrop-blur-2xl border border-white/80 rounded-xl shadow-glass-lg
            animate-slide-up overflow-hidden`}>
            {typeof children === 'function' ? children(close) : children}
          </div>
        </>
      )}
    </div>
  );
}

export function DropdownItem({
  icon,
  label,
  sublabel,
  onClick,
  danger = false,
}: {
  icon?: ReactNode;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-navy-50/60 transition-colors
        ${danger ? 'text-red-600 hover:bg-red-50/60' : 'text-navy-700'}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">{label}</span>
        {sublabel && <span className="block text-xs text-navy-400 truncate">{sublabel}</span>}
      </span>
    </button>
  );
}
