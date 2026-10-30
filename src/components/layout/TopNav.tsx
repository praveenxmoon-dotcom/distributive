import { useState } from 'react';
import { Bell, Search, Menu, Zap, ChevronRight, LogOut, User, Settings as SettingsIcon, CheckCheck } from 'lucide-react';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { Tooltip, DemoBadge } from '@/components/ui/GlassCard';
import { notifications as initialNotifications, DEMO_USER } from '@/data/demoData';
import type { PageId } from '@/components/layout/Sidebar';
import type { Notification } from '@/types';

const pageTitles: Record<PageId, { title: string; breadcrumb: string }> = {
  overview: { title: 'Overview', breadcrumb: 'Dashboard' },
  disruptions: { title: 'Live Disruptions', breadcrumb: 'Operations' },
  shipments: { title: 'Shipments', breadcrumb: 'Operations' },
  recovery: { title: 'Recovery Plans', breadcrumb: 'Operations' },
  approvals: { title: 'Approvals', breadcrumb: 'Operations' },
  suppliers: { title: 'Suppliers', breadcrumb: 'Directory' },
  inventory: { title: 'Inventory', breadcrumb: 'Warehouse' },
  audit: { title: 'Audit Trail', breadcrumb: 'Compliance' },
  settings: { title: 'Settings', breadcrumb: 'Preferences' },
};

const notifIconColor: Record<string, string> = {
  alert: 'text-red-500',
  info: 'text-electric-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
};

interface TopNavProps {
  currentPage: PageId;
  onOpenMobileMenu: () => void;
  onNavigate: (page: PageId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function TopNav({ currentPage, onOpenMobileMenu, onNavigate, searchQuery, onSearchChange }: TopNavProps) {
  const [notifs, setNotifs] = useState<Notification[]>(initialNotifications);
  const unreadCount = notifs.filter((n) => !n.read).length;
  const pageInfo = pageTitles[currentPage];

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-30 bg-white/60 backdrop-blur-2xl border-b border-white/60">
      <div className="flex items-center gap-3 h-16 px-4 sm:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-navy-600 hover:bg-navy-50 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Page title + breadcrumb */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-navy-400">
            <span className="font-medium">{pageInfo.breadcrumb}</span>
            <ChevronRight size={12} />
            <span className="text-navy-600 font-medium">{pageInfo.title}</span>
          </div>
          <h1 className="text-lg font-bold text-navy-900 leading-tight truncate">{pageInfo.title}</h1>
        </div>

        {/* Search - hidden on small screens */}
        <div className="hidden md:block relative w-56 lg:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search orders, plans, disruptions…"
            className="glass-input w-full h-9 rounded-xl text-sm pl-10 pr-3"
          />
        </div>

        {/* Simulation mode indicator */}
        <Tooltip text="This dashboard runs on synthetic demo data. No real backend operations are performed.">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/70">
            <Zap size={14} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Simulation</span>
          </div>
        </Tooltip>

        {/* Notifications */}
        <Dropdown
          width="w-80"
          trigger={
            <div className="relative p-2 rounded-lg text-navy-600 hover:bg-navy-50 transition-colors cursor-pointer">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          }
        >
          {(close: () => void) => (
            <div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100/60">
                <span className="text-sm font-semibold text-navy-800">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-electric-600 font-medium hover:text-electric-700"
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifs.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-navy-50/50 hover:bg-navy-50/40 transition-colors ${!n.read ? 'bg-electric-50/30' : ''}`}
                  >
                    <span className={`mt-0.5 shrink-0 ${notifIconColor[n.type]}`}>
                      <Bell size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-navy-800">{n.title}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-electric-500 shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-navy-500 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-navy-400 mt-1 block">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-navy-100/60">
                <DemoBadge className="w-full justify-center" />
              </div>
            </div>
          )}
        </Dropdown>

        {/* Profile */}
        <Dropdown
          width="w-56"
          trigger={
            <div className="flex items-center gap-2.5 p-1 pr-2 rounded-xl hover:bg-navy-50/60 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-600 to-electric-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {DEMO_USER.avatar}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <div className="text-xs font-semibold text-navy-800 truncate max-w-[100px]">{DEMO_USER.name}</div>
                <div className="text-[10px] text-navy-400 truncate">{DEMO_USER.role}</div>
              </div>
            </div>
          }
        >
          {(close: () => void) => (
            <div>
              <div className="px-4 py-3 border-b border-navy-100/60">
                <div className="text-sm font-semibold text-navy-800">{DEMO_USER.name}</div>
                <div className="text-xs text-navy-400">{DEMO_USER.email}</div>
              </div>
              <DropdownItem
                icon={<User size={16} />}
                label="Profile"
                sublabel={DEMO_USER.role}
                onClick={() => { onNavigate('settings'); close(); }}
              />
              <DropdownItem
                icon={<SettingsIcon size={16} />}
                label="Settings"
                onClick={() => { onNavigate('settings'); close(); }}
              />
              <div className="border-t border-navy-100/60">
                <DropdownItem
                  icon={<LogOut size={16} />}
                  label="Sign Out"
                  sublabel="Demo session"
                  danger
                  onClick={close}
                />
              </div>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
