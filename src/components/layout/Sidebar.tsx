import {
  LayoutDashboard, AlertTriangle, Truck, ShieldCheck, CheckSquare,
  Building2, Package, ScrollText, Settings, ChevronLeft, ChevronRight,
  Radio, X,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/GlassCard';
import { DEMO_USER } from '@/data/demoData';

export type PageId =
  | 'overview' | 'disruptions' | 'shipments' | 'recovery'
  | 'approvals' | 'suppliers' | 'inventory' | 'audit' | 'settings';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'disruptions', label: 'Live Disruptions', icon: AlertTriangle },
  { id: 'shipments', label: 'Shipments', icon: Truck },
  { id: 'recovery', label: 'Recovery Plans', icon: ShieldCheck },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare },
  { id: 'suppliers', label: 'Suppliers', icon: Building2 },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'audit', label: 'Audit Trail', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  currentPage, onNavigate, collapsed, onToggleCollapse, mobileOpen, onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/30 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen
        flex flex-col
        bg-white/65 backdrop-blur-2xl border-r border-white/60
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-3 h-16 px-4 border-b border-navy-100/50 shrink-0 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-500 to-electric-700 flex items-center justify-center shrink-0 shadow-glass-sm">
            <Radio size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold text-navy-900 leading-tight">DisruptionIQ</div>
              <div className="text-[10px] text-navy-400 font-medium tracking-wide uppercase">Control Tower</div>
            </div>
          )}
          <button
            onClick={onCloseMobile}
            className="lg:hidden absolute top-4 right-3 p-1.5 rounded-lg text-navy-400 hover:bg-navy-50"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            const link = (
              <button
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-electric-600 text-white shadow-glass-sm'
                    : 'text-navy-600 hover:bg-white/70 hover:text-navy-900'
                  }
                  ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );

            if (collapsed) {
              return (
                <div key={item.id} className="flex justify-center">
                  <Tooltip text={item.label}>{link}</Tooltip>
                </div>
              );
            }
            return <div key={item.id}>{link}</div>;
          })}
        </nav>

        {/* Profile */}
        <div className={`border-t border-navy-100/50 p-3 shrink-0 ${collapsed ? 'px-1' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-600 to-electric-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {DEMO_USER.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-navy-800 truncate">{DEMO_USER.name}</div>
                <div className="text-xs text-navy-400 truncate">{DEMO_USER.role}</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Tooltip text={`${DEMO_USER.name} — ${DEMO_USER.role}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-600 to-electric-600 flex items-center justify-center text-white text-xs font-bold">
                  {DEMO_USER.avatar}
                </div>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white border border-navy-200
            items-center justify-center text-navy-500 hover:text-electric-600 hover:border-electric-300
            shadow-glass-sm transition-colors z-50"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
}
