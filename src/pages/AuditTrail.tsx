import { useState, useMemo } from 'react';
import {
  ScrollText, Search, AlertTriangle, ShieldCheck, FileText,
  Truck, Package, Settings as SettingsIcon, CheckSquare,
} from 'lucide-react';
import { GlassCard, SectionHeader, DemoBadge } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/States';
import { auditEvents } from '@/data/demoData';
import type { AuditEvent } from '@/types';

const categoryIcon = {
  disruption: <AlertTriangle size={14} className="text-red-500" />,
  plan: <FileText size={14} className="text-navy-500" />,
  approval: <CheckSquare size={14} className="text-emerald-500" />,
  shipment: <Truck size={14} className="text-amber-500" />,
  inventory: <Package size={14} className="text-electric-500" />,
  system: <SettingsIcon size={14} className="text-navy-400" />,
};

const categoryBg = {
  disruption: 'bg-red-50 border-red-100',
  plan: 'bg-navy-50 border-navy-100',
  approval: 'bg-emerald-50 border-emerald-100',
  shipment: 'bg-amber-50 border-amber-100',
  inventory: 'bg-electric-50 border-electric-100',
  system: 'bg-navy-50 border-navy-100',
};

export function AuditTrailPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');

  const actors = useMemo(() => [...new Set(auditEvents.map((e) => e.actor))], []);

  const filtered = useMemo(() => {
    return auditEvents.filter((e) => {
      if (search && !e.action.toLowerCase().includes(search.toLowerCase()) &&
          !e.entityId.toLowerCase().includes(search.toLowerCase()) &&
          !e.actor.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (actorFilter && e.actor !== actorFilter) return false;
      return true;
    });
  }, [search, categoryFilter, actorFilter]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <GlassCard className="p-4 animate-slide-up">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, entity ID, or actor…"
              className="glass-input w-full h-10 rounded-xl text-sm pl-10 pr-3"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="All Categories"
            options={[
              { value: 'disruption', label: 'Disruptions' },
              { value: 'plan', label: 'Recovery Plans' },
              { value: 'approval', label: 'Approvals' },
              { value: 'shipment', label: 'Shipments' },
              { value: 'inventory', label: 'Inventory' },
              { value: 'system', label: 'System' },
            ]}
            className="w-full sm:w-44"
          />
          <Select
            value={actorFilter}
            onChange={setActorFilter}
            placeholder="All Actors"
            options={actors.map((a) => ({ value: a, label: a }))}
            className="w-full sm:w-44"
          />
        </div>
      </GlassCard>

      {/* Audit table */}
      <GlassCard className="p-5 animate-slide-up animate-delay-100">
        <SectionHeader
          title="Audit Trail"
          subtitle={`${filtered.length} of ${auditEvents.length} events`}
          icon={<ScrollText size={18} />}
          action={<DemoBadge />}
        />
        {filtered.length === 0 ? (
          <EmptyState icon={<ScrollText size={24} />} title="No events found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100/70">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Actor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Entity ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Plan Version</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr key={event.id} className="border-b border-navy-50/50 hover:bg-navy-50/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-navy-500 tabular-nums whitespace-nowrap">{event.timestamp}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-navy-700">{event.actor}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-600">{event.action}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${categoryBg[event.category]}`}>
                          {categoryIcon[event.category]}
                        </span>
                        <span className="text-xs text-navy-500">{event.entity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-electric-600">{event.entityId}</td>
                    <td className="px-4 py-3">
                      {event.planVersion ? (
                        <Badge variant="info">{event.planVersion}</Badge>
                      ) : (
                        <span className="text-xs text-navy-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {event.simulated ? (
                        <Badge variant="warning" dot>Simulated</Badge>
                      ) : (
                        <Badge variant="success" dot>Backend</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
