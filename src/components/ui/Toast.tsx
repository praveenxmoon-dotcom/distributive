import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

const iconMap = {
  success: <CheckCircle2 size={18} className="text-emerald-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  info: <Info size={18} className="text-electric-500" />,
  warning: <AlertCircle size={18} className="text-amber-500" />,
};

const bgMap = {
  success: 'border-emerald-200/60',
  error: 'border-red-200/60',
  info: 'border-electric-200/60',
  warning: 'border-amber-200/60',
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => onDismiss(t.id), 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 bg-white/85 backdrop-blur-xl border ${bgMap[toast.type]}
            rounded-xl shadow-glass-lg animate-slide-in-right`}
        >
          <span className="shrink-0 mt-0.5">{iconMap[toast.type]}</span>
          <p className="text-sm text-navy-700 font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-navy-400 hover:text-navy-700 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
