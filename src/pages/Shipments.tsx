import { useState, useMemo } from 'react';
import { Truck, Search, ArrowRight, MapPin, Package } from 'lucide-react';
import { GlassCard, SectionHeader, DemoBadge } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { shipments, disruptions } from '@/data/demoData';
import type { Shipment } from '@/types';

const priorityVariant: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
  Urgent: 'critical', High: 'high', Medium: 'medium', Low: 'low',
};

export function ShipmentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selected, setSelected] = useState<Shipment | null>(null);

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      if (search && !s.id.toLowerCase().includes(search.toLowerCase()) &&
          !s.orderId.toLowerCase().includes(search.toLowerCase()) &&
          !s.origin.toLowerCase().includes(search.toLowerCase()) &&
          !s.destination.toLowerCase().includes(search.toLowerCase()) &&
          !s.carrier.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (priorityFilter && s.priority !== priorityFilter) return false;
      return true;
    });
  }, [search, statusFilter, priorityFilter]);

  const columns: Column<Shipment>[] = [
    {
      key: 'id', label: 'Shipment ID', sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-semibold text-navy-800">{r.id}</span>,
    },
    {
      key: 'orderId', label: 'Order', sortable: true,
      sortValue: (r) => r.orderId,
      render: (r) => <span className="text-navy-600">{r.orderId}</span>,
    },
    {
      key: 'route', label: 'Route', sortable: true,
      sortValue: (r) => r.origin,
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-navy-600">{r.origin.split(' ')[0]}</span>
          <ArrowRight size={11} className="text-navy-300" />
          <span className="text-navy-600">{r.destination.split(' ')[0]}</span>
        </div>
      ),
    },
    {
      key: 'priority', label: 'Priority', sortable: true,
      sortValue: (r) => r.priority,
      render: (r) => <Badge variant={priorityVariant[r.priority]} dot>{r.priority}</Badge>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      sortValue: (r) => r.status,
      render: (r) => <Badge variant={r.status === 'Delivered' ? 'success' : r.status === 'Held' ? 'warning' : r.status === 'Delayed' ? 'danger' : r.status === 'Rerouted' ? 'info' : 'neutral'}>{r.status}</Badge>,
    },
    {
      key: 'carrier', label: 'Carrier', sortable: true,
      sortValue: (r) => r.carrier,
      render: (r) => <span className="text-xs text-navy-500">{r.carrier}</span>,
    },
    {
      key: 'eta', label: 'ETA', sortable: true,
      sortValue: (r) => r.eta,
      render: (r) => <span className="text-xs text-navy-500 tabular-nums">{r.eta}</span>,
    },
    {
      key: 'delayRisk', label: 'Delay Risk', sortable: true,
      sortValue: (r) => r.delayRisk,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-14 h-1.5 rounded-full bg-navy-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${r.delayRisk >= 80 ? 'bg-red-500' : r.delayRisk >= 50 ? 'bg-amber-500' : r.delayRisk > 0 ? 'bg-electric-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.max(r.delayRisk, 3)}%` }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums text-navy-700">{r.delayRisk}%</span>
        </div>
      ),
    },
    {
      key: 'disruption', label: 'Linked Disruption',
      render: (r) => r.linkedDisruptionId ?
        <span className="text-xs text-electric-600 font-medium">{r.linkedDisruptionId}</span> :
        <span className="text-xs text-navy-300">—</span>,
    },
  ];

  const linkedDisruption = selected ? disruptions.find((d) => d.id === selected.linkedDisruptionId) : null;

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
              placeholder="Search shipment ID, order, carrier, or location…"
              className="glass-input w-full h-10 rounded-xl text-sm pl-10 pr-3"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[
              { value: 'In Transit', label: 'In Transit' },
              { value: 'Delayed', label: 'Delayed' },
              { value: 'Held', label: 'Held' },
              { value: 'Rerouted', label: 'Rerouted' },
              { value: 'Delivered', label: 'Delivered' },
            ]}
            className="w-full sm:w-40"
          />
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            placeholder="All Priorities"
            options={[
              { value: 'Urgent', label: 'Urgent' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
            className="w-full sm:w-40"
          />
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-5 animate-slide-up animate-delay-100">
        <SectionHeader
          title="All Shipments"
          subtitle={`${filtered.length} of ${shipments.length} shipments`}
          icon={<Truck size={18} />}
          action={<DemoBadge />}
        />
        <GlassCard className="p-0 overflow-hidden">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(r) => r.id}
            onRowClick={setSelected}
            emptyMessage="No shipments found"
            emptyDescription="Try adjusting your search or filters."
            emptyIcon={<Truck size={24} />}
          />
        </GlassCard>
      </GlassCard>

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Shipment ${selected.id}` : ''}
        subtitle={selected ? `Order ${selected.orderId}` : ''}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={selected.status === 'Delivered' ? 'success' : selected.status === 'Held' ? 'warning' : selected.status === 'Delayed' ? 'danger' : 'info'} dot>{selected.status}</Badge>
              <Badge variant={priorityVariant[selected.priority]}>{selected.priority} Priority</Badge>
              <DemoBadge />
            </div>

            {/* Route */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-navy-50/60 to-electric-50/40 border border-navy-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-electric-600" />
                  <div>
                    <div className="text-sm font-semibold text-navy-800">{selected.origin}</div>
                    <div className="text-[10px] text-navy-400">Origin</div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-navy-300" />
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-navy-600" />
                  <div>
                    <div className="text-sm font-semibold text-navy-800">{selected.destination}</div>
                    <div className="text-[10px] text-navy-400">Destination</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
                <div className="text-[10px] text-navy-400 uppercase tracking-wider mb-1">Carrier</div>
                <div className="text-sm font-semibold text-navy-800">{selected.carrier}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
                <div className="text-[10px] text-navy-400 uppercase tracking-wider mb-1">ETA</div>
                <div className="text-sm font-semibold text-navy-800 tabular-nums">{selected.eta}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
                <div className="text-[10px] text-navy-400 uppercase tracking-wider mb-1">Delay Risk</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-navy-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${selected.delayRisk >= 80 ? 'bg-red-500' : selected.delayRisk >= 50 ? 'bg-amber-500' : 'bg-electric-500'}`}
                      style={{ width: `${selected.delayRisk}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{selected.delayRisk}%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
                <div className="text-[10px] text-navy-400 uppercase tracking-wider mb-1">Customer Impact</div>
                <div className="text-xs font-medium text-navy-700">{selected.customerImpact}</div>
              </div>
            </div>

            {/* Linked disruption */}
            {linkedDisruption ? (
              <div className="p-4 rounded-xl bg-red-50/40 border border-red-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <Package size={14} className="text-red-500" />
                  <span className="text-xs font-semibold text-navy-700 uppercase tracking-wider">Linked Disruption</span>
                </div>
                <div className="text-sm font-semibold text-navy-800">{linkedDisruption.id}</div>
                <p className="text-xs text-navy-500 mt-1">{linkedDisruption.summary}</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100/50">
                <span className="text-sm text-emerald-700 font-medium">No linked disruption — shipment operating normally.</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
