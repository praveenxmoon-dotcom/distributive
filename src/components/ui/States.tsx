import { type ReactNode } from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-400 mb-4">
        {icon || <SearchX size={24} />}
      </div>
      <h3 className="text-base font-semibold text-navy-800">{title}</h3>
      {description && <p className="text-sm text-navy-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-3 text-navy-500">
        <div className="w-5 h-5 border-2 border-electric-200 border-t-electric-600 rounded-full animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-400 mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-navy-800">{message}</h3>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 text-sm text-electric-600 font-medium hover:text-electric-700">
          Try again
        </button>
      )}
    </div>
  );
}
