import { MapPin, Truck, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { GlassCard, DemoBadge } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/GlassCard';
import type { Disruption } from '@/types';

interface RouteMapProps {
  disruption: Disruption;
  onView: () => void;
}

export function RouteMap({ disruption, onView }: RouteMapProps) {
  return (
    <GlassCard className="p-5 animate-slide-up animate-delay-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-navy-900">Live Disruption</h3>
            <DemoBadge />
          </div>
          <p className="text-sm text-navy-500">{disruption.corridor}</p>
        </div>
        <Badge variant="critical" dot>{disruption.status}</Badge>
      </div>

      {/* Route visualization */}
      <div className="relative bg-gradient-to-br from-navy-50/60 to-electric-50/40 rounded-xl border border-navy-100/50 p-5 mb-4">
        <div className="flex items-center justify-between">
          {/* Origin */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/80 border border-navy-200/60 flex items-center justify-center shadow-glass-sm">
              <MapPin size={20} className="text-electric-600" />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-navy-800">{disruption.origin.split(' ')[0]}</div>
              <div className="text-[10px] text-navy-400">Warehouse</div>
            </div>
          </div>

          {/* Route line */}
          <div className="flex-1 relative flex items-center justify-center mx-3">
            <div className="w-full h-0.5 bg-navy-200/60 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-electric-400 via-amber-400 to-electric-400 opacity-60" />
              {/* Breakdown point */}
              <Tooltip text="Truck RT-0447 engine failure">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-red-50 border-2 border-red-300 flex items-center justify-center shadow-glass-sm">
                      <AlertTriangle size={14} className="text-red-500" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping opacity-40" />
                  </div>
                </div>
              </Tooltip>
            </div>
            <Truck size={16} className="absolute left-[30%] text-navy-400 -top-2" />
          </div>

          {/* Destination */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/80 border border-navy-200/60 flex items-center justify-center shadow-glass-sm">
              <MapPin size={20} className="text-navy-600" />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-navy-800">{disruption.destination.split(' ')[0]}</div>
              <div className="text-[10px] text-navy-400">Warehouse</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 mt-3 text-xs text-navy-400">
          <ArrowRight size={12} />
          <span>NH-44 · ~2,200 km · Breakdown near Nagpur</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-white/50 border border-navy-100/50">
          <div className="text-xl font-bold text-navy-900 tabular-nums">{disruption.affectedShipments}</div>
          <div className="text-[11px] text-navy-400 font-medium">Shipments</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-white/50 border border-navy-100/50">
          <div className="text-xl font-bold text-navy-900 tabular-nums">{disruption.affectedOrders}</div>
          <div className="text-[11px] text-navy-400 font-medium">Orders</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-white/50 border border-navy-100/50">
          <div className="flex items-center justify-center gap-1 text-xl font-bold text-amber-600 tabular-nums">
            <Clock size={14} />
            {disruption.estimatedDelayHrs}h
          </div>
          <div className="text-[11px] text-navy-400 font-medium">Est. Delay</div>
        </div>
      </div>

      {/* Timeline preview */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2">Incident Timeline</div>
        <div className="space-y-2">
          {disruption.timeline.slice(0, 3).map((event, i) => (
            <div key={event.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-500' : 'bg-navy-300'}`} />
                {i < 2 && <div className="w-px h-5 bg-navy-200" />}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-navy-700">{event.label}</span>
                  <span className="text-[10px] text-navy-400">{event.time}</span>
                </div>
                <p className="text-xs text-navy-500 truncate">{event.description}</p>
              </div>
            </div>
          ))}
          <div className="text-xs text-navy-400 pl-5">+{disruption.timeline.length - 3} more events</div>
        </div>
      </div>

      <Button variant="primary" size="md" className="w-full" onClick={onView} icon={<ArrowRight size={15} />}>
        View Disruption
      </Button>
    </GlassCard>
  );
}
