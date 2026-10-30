import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-navy-950/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col
        bg-white/90 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-glass-lg
        animate-slide-up`}>
        <div className="flex items-start justify-between p-5 border-b border-navy-100/60">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
            {subtitle && <p className="text-sm text-navy-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-700 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-navy-100/60 bg-white/40 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
