import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ToastData } from '@/components/ui/Toast';

interface AppState {
  toasts: ToastData[];
  addToast: (message: string, type?: ToastData['type']) => void;
  dismissToast: (id: string) => void;
  approvedPlans: Set<string>;
  rejectedPlans: Set<string>;
  approvePlan: (planId: string, version: string) => void;
  rejectPlan: (planId: string, version: string) => void;
  invalidatedPlans: Set<string>;
  invalidatePlan: (planId: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [approvedPlans, setApprovedPlans] = useState<Set<string>>(new Set());
  const [rejectedPlans, setRejectedPlans] = useState<Set<string>>(new Set());
  const [invalidatedPlans, setInvalidatedPlans] = useState<Set<string>>(new Set());

  const addToast = useCallback((message: string, type: ToastData['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const approvePlan = useCallback((planId: string, version: string) => {
    setApprovedPlans((prev) => new Set(prev).add(planId));
    setRejectedPlans((prev) => {
      const next = new Set(prev);
      next.delete(planId);
      return next;
    });
    addToast(`Plan ${planId} ${version} approved (DEMO — not recorded on any backend)`, 'success');
  }, [addToast]);

  const rejectPlan = useCallback((planId: string, version: string) => {
    setRejectedPlans((prev) => new Set(prev).add(planId));
    setApprovedPlans((prev) => {
      const next = new Set(prev);
      next.delete(planId);
      return next;
    });
    addToast(`Plan ${planId} ${version} rejected (DEMO — not recorded on any backend)`, 'warning');
  }, [addToast]);

  const invalidatePlan = useCallback((planId: string) => {
    setInvalidatedPlans((prev) => new Set(prev).add(planId));
    setApprovedPlans((prev) => {
      const next = new Set(prev);
      next.delete(planId);
      return next;
    });
    addToast(`Plan ${planId} modified — previous approval invalidated, revalidation required (DEMO)`, 'warning');
  }, [addToast]);

  return (
    <AppContext.Provider value={{
      toasts, addToast, dismissToast,
      approvedPlans, rejectedPlans, approvePlan, rejectPlan,
      invalidatedPlans, invalidatePlan,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
