import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DemoBadge, Tooltip } from '@/components/ui/GlassCard';
import {
  AlertTriangle, MapPin, Truck, Package, Clock, ArrowRight,
  ShieldCheck, FileText, User,
} from 'lucide-react';
import type { Disruption, RecoveryPlan, Shipment } from '@/types';
import type { PageId } from '@/components/layout/Sidebar';

interface DisruptionDetailModalProps {
  disruption: Disruption | null;
  plans: RecoveryPlan[];
  shipments: Shipment[];
  onClose: () => void;
  onNavigate: (page: PageId) => void;
  onSelectPlan: (id: string) => void;
}

export function DisruptionDetailModal({
  disruption, plans, shipments, onClose, onNavigate, onSelectPlan,
}: DisruptionDetailModalProps) {
  if (!disruption) return null;

  const linkedPlans = plans.filter((p) => p.disruptionId === disruption.id);
  const linkedShipments = shipments.filter((s) => s.linkedDisruptionId === disruption.id);

  return (
    <Modal
      open={!!disruption}
      onClose={onClose}
      title={`Disruption ${disruption.id}`}
      subtitle={disruption.corridor}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={() => onNavigate('recovery')} icon={<ShieldCheck size={15} />}>
            View Recovery Plans
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Status header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="critical" dot>{disruption.status}</Badge>
          <Badge variant={disruption.severity === 'Critical' ? 'critical' : disruption.severity === 'High' ? 'high' : disruption.severity === 'Medium' ? 'medium' : 'low'}>
            {disruption.severity} Severity
          </Badge>
          <Badge variant="neutral">{disruption.type}</Badge>
          <DemoBadge />
        </div>

        {/* Summary */}
        <p className="text-sm text-navy-600 leading-relaxed">{disruption.summary}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
            <Truck size={16} className="text-electric-500 mb-1.5" />
            <div className="text-lg font-bold text-navy-900 tabular-nums">{disruption.affectedShipments}</div>
            <div className="text-[11px] text-navy-400">Affected Shipments</div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
            <Package size={16} className="text-amber-500 mb-1.5" />
            <div className="text-lg font-bold text-navy-900 tabular-nums">{disruption.affectedOrders}</div>
            <div className="text-[11px] text-navy-400">Affected Orders</div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
            <Clock size={16} className="text-rose-500 mb-1.5" />
            <div className="flex items-center gap-1 text-lg font-bold text-navy-900 tabular-nums">
              {disruption.estimatedDelayHrs}h
            </div>
            <div className="text-[11px] text-navy-400">Est. Delay (Synthetic)</div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
            <AlertTriangle size={16} className="text-navy-500 mb-1.5" />
            <div className="text-sm font-bold text-navy-900">{disruption.detectedAt.split(' ')[0]}</div>
            <div className="text-[11px] text-navy-400">Detected</div>
          </div>
        </div>

        {/* Route */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-navy-50/60 to-electric-50/40 border border-navy-100/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Route</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-electric-600" />
              <span className="text-sm font-medium text-navy-800">{disruption.origin}</span>
            </div>
            <ArrowRight size={16} className="text-navy-300" />
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-navy-600" />
              <span className="text-sm font-medium text-navy-800">{disruption.destination}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Incident Timeline</span>
            <DemoBadge />
          </div>
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-navy-200" />
            <div className="space-y-4">
              {disruption.timeline.map((event, i) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white
                    ${i === 0 ? 'border-red-400' : 'border-navy-300'}`}>
                    {i === 0 && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-navy-800">{event.label}</span>
                      <span className="text-xs text-navy-400">{event.time}</span>
                    </div>
                    <p className="text-xs text-navy-500 mt-0.5">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Linked shipments */}
        {linkedShipments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Affected Shipments</span>
              <DemoBadge />
            </div>
            <div className="space-y-2">
              {linkedShipments.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/50 border border-navy-100/40 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-navy-800">{s.id}</span>
                    <span className="text-navy-400">→</span>
                    <span className="text-navy-600">{s.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.priority === 'Urgent' ? 'critical' : s.priority === 'High' ? 'high' : 'medium'}>{s.priority}</Badge>
                    <Badge variant={s.status === 'Delivered' ? 'success' : s.status === 'Held' ? 'warning' : 'danger'}>{s.status}</Badge>
                  </div>
                </div>
              ))}
              {linkedShipments.length > 5 && (
                <button
                  onClick={() => onNavigate('shipments')}
                  className="text-xs text-electric-600 font-medium hover:text-electric-700"
                >
                  View all {linkedShipments.length} shipments →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Linked plans */}
        {linkedPlans.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Recovery Plans</span>
              <DemoBadge />
            </div>
            <div className="space-y-2">
              {linkedPlans.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-navy-100/40 hover:bg-white/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={15} className="text-navy-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-navy-800">{p.id}</span>
                        <Badge variant="info">{p.version}</Badge>
                      </div>
                      <span className="text-xs text-navy-500">{p.strategy}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onSelectPlan(p.id)} icon={<ArrowRight size={13} />}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
