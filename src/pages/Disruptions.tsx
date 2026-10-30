import { useState, useMemo } from 'react';
import { AlertTriangle, Search, Filter, ArrowRight, ChevronRight } from 'lucide-react';
import { GlassCard, SectionHeader, DemoBadge } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/States';
import { Tooltip } from '@/components/ui/GlassCard';
import { disruptions } from '@/data/demoData';
import { DisruptionDetailModal } from '@/components/disruptions/DisruptionDetailModal';
import { recoveryPlans, shipments } from '@/data/demoData';
import type { Disruption, DisruptionStatus, DisruptionSeverity } from '@/types';
import type { PageId } from '@/components/layout/Sidebar';

interface DisruptionsPageProps {
  selectedDisruptionId: string | null;
  onSelectDisruption: (id: string | null) => void;
  onNavigate: (page: PageId) => void;
  onSelectPlan: (id: string) => void;
}

export function DisruptionsPage({ selectedDisruptionId, onSelectDisruption, onNavigate, onSelectPlan }: DisruptionsPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const filtered = useMemo(() => {
    return disruptions.filter((d) => {
      if (search && !d.id.toLowerCase().includes(search.toLowerCase()) &&
          !d.corridor.toLowerCase().includes(search.toLowerCase()) &&
          !d.type.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (severityFilter && d.severity !== severityFilter) return false;
      return true;
    });
  }, [search, statusFilter, severityFilter]);

  const selectedDisruption = disruptions.find((d) => d.id === selectedDisruptionId) || null;

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
              placeholder="Search by disruption ID, corridor, or type…"
              className="glass-input w-full h-10 rounded-xl text-sm pl-10 pr-3"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Monitoring', label: 'Monitoring' },
              { value: 'Investigating', label: 'Investigating' },
              { value: 'Resolved', label: 'Resolved' },
            ]}
            className="w-full sm:w-44"
          />
          <Select
            value={severityFilter}
            onChange={setSeverityFilter}
            placeholder="All Severities"
            options={[
              { value: 'Critical', label: 'Critical' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
            className="w-full sm:w-44"
          />
        </div>
      </GlassCard>

      {/* Disruption cards */}
      {filtered.length === 0 ? (
        <GlassCard className="p-0">
          <EmptyState
            icon={<AlertTriangle size={24} />}
            title="No disruptions found"
            description="Try adjusting your search or filter criteria."
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((disruption, i) => (
            <DisruptionCard
              key={disruption.id}
              disruption={disruption}
              onView={() => onSelectDisruption(disruption.id)}
              delay={i * 100}
            />
          ))}
        </div>
      )}

      <DisruptionDetailModal
        disruption={selectedDisruption}
        plans={recoveryPlans}
        shipments={shipments}
        onClose={() => onSelectDisruption(null)}
        onNavigate={onNavigate}
        onSelectPlan={onSelectPlan}
      />
    </div>
  );
}

function DisruptionCard({ disruption, onView, delay }: { disruption: Disruption; onView: () => void; delay: number }) {
  return (
    <GlassCard className="p-5 animate-slide-up hover:shadow-glass-lg transition-shadow" >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center
            ${disruption.severity === 'Critical' ? 'bg-red-50 border-red-100 text-red-500' :
              disruption.severity === 'High' ? 'bg-orange-50 border-orange-100 text-orange-500' :
              disruption.severity === 'Medium' ? 'bg-amber-50 border-amber-100 text-amber-500' :
              'bg-electric-50 border-electric-100 text-electric-500'}`}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-navy-900">{disruption.id}</span>
              <DemoBadge />
            </div>
            <span className="text-xs text-navy-500">{disruption.type}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={disruption.status === 'Active' ? 'critical' : disruption.status === 'Monitoring' ? 'info' : disruption.status === 'Investigating' ? 'warning' : 'success'} dot>
            {disruption.status}
          </Badge>
          <Badge variant={disruption.severity === 'Critical' ? 'critical' : disruption.severity === 'High' ? 'high' : disruption.severity === 'Medium' ? 'medium' : 'low'}>
            {disruption.severity}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-navy-500 mb-3">
        <span className="font-medium">{disruption.origin}</span>
        <ChevronRight size={12} className="text-navy-300" />
        <span className="font-medium">{disruption.destination}</span>
        <span className="text-navy-300">·</span>
        <span>{disruption.corridor}</span>
      </div>

      <p className="text-sm text-navy-600 leading-relaxed mb-4">{disruption.summary}</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2.5 rounded-lg bg-white/50 border border-navy-100/40">
          <div className="text-lg font-bold text-navy-900 tabular-nums">{disruption.affectedShipments}</div>
          <div className="text-[10px] text-navy-400">Shipments</div>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-white/50 border border-navy-100/40">
          <div className="text-lg font-bold text-navy-900 tabular-nums">{disruption.affectedOrders}</div>
          <div className="text-[10px] text-navy-400">Orders</div>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-white/50 border border-navy-100/40">
          <Tooltip text="Synthetic estimate — not a confirmed delay.">
            <div className="text-lg font-bold text-amber-600 tabular-nums">{disruption.estimatedDelayHrs}h</div>
          </Tooltip>
          <div className="text-[10px] text-navy-400">Est. Delay</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-navy-400 mb-4">
        <span>Detected: {disruption.detectedAt}</span>
        <span>{disruption.timeline.length} timeline events</span>
      </div>

      <Button variant="primary" size="md" className="w-full" onClick={onView} icon={<ArrowRight size={15} />}>
        View Disruption Details
      </Button>
    </GlassCard>
  );
}
