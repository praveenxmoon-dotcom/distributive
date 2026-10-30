import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ToastContainer } from '@/components/ui/Toast';
import { Sidebar, type PageId } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { Overview } from '@/pages/Overview';
import { DisruptionsPage } from '@/pages/Disruptions';
import { ShipmentsPage } from '@/pages/Shipments';
import { RecoveryPlansPage } from '@/pages/RecoveryPlans';
import { ApprovalsPage } from '@/pages/Approvals';
import { SuppliersPage } from '@/pages/Suppliers';
import { InventoryPage } from '@/pages/Inventory';
import { AuditTrailPage } from '@/pages/AuditTrail';
import { SettingsPage } from '@/pages/Settings';

function AppContent() {
  const { toasts, dismissToast } = useApp();
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisruptionId, setSelectedDisruptionId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Scroll to top on page change
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) main.scrollTo(0, 0);
  }, [currentPage]);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    setSelectedDisruptionId(null);
    setSelectedPlanId(null);
  };

  const handleSelectDisruption = (id: string) => {
    setSelectedDisruptionId(id);
    setCurrentPage('disruptions');
  };

  const handleSelectPlan = (id: string) => {
    setSelectedPlanId(id);
    setCurrentPage('recovery');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return (
          <Overview
            onNavigate={handleNavigate}
            onSelectDisruption={handleSelectDisruption}
            onSelectPlan={handleSelectPlan}
          />
        );
      case 'disruptions':
        return (
          <DisruptionsPage
            selectedDisruptionId={selectedDisruptionId}
            onSelectDisruption={setSelectedDisruptionId}
            onNavigate={handleNavigate}
            onSelectPlan={handleSelectPlan}
          />
        );
      case 'shipments':
        return <ShipmentsPage />;
      case 'recovery':
        return (
          <RecoveryPlansPage
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            onNavigate={handleNavigate}
          />
        );
      case 'approvals':
        return <ApprovalsPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'audit':
        return <AuditTrailPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50/80 via-white to-electric-50/30">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-electric-200/20 blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-navy-200/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-electric-100/20 blur-3xl" />
      </div>

      <div className="relative flex">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 min-w-0 flex flex-col h-screen">
          <TopNav
            currentPage={currentPage}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <main id="main-content" className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6">
            <div key={currentPage} className="animate-fade-in max-w-[1600px] mx-auto">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
