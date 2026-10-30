import { Activity, FileText, ShieldCheck, AlertTriangle, CheckSquare } from 'lucide-react';
import { GlassCard, DemoBadge } from '@/components/ui/GlassCard';
import { activityEvents } from '@/data/demoData';

const iconMap = {
  disruption: <AlertTriangle size={14} className="text-red-500" />,
  analysis: <Activity size={14} className="text-electric-500" />,
  plan: <FileText size={14} className="text-navy-500" />,
  approval: <CheckSquare size={14} className="text-emerald-500" />,
  shipment: <ShieldCheck size={14} className="text-amber-500" />,
};

const iconBgMap = {
  disruption: 'bg-red-50 border-red-100',
  analysis: 'bg-electric-50 border-electric-100',
  plan: 'bg-navy-50 border-navy-100',
  approval: 'bg-emerald-50 border-emerald-100',
  shipment: 'bg-amber-50 border-amber-100',
};

export function RecentActivity() {
  return (
    <GlassCard className="p-5 animate-slide-up animate-delay-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-navy-900">Recent Activity</h3>
          <DemoBadge />
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-navy-200 via-navy-200 to-transparent" />
        <div className="space-y-4">
          {activityEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-3 relative">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 z-10 ${iconBgMap[event.type]} bg-white/90`}>
                {iconMap[event.type]}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-navy-800">{event.title}</span>
                  <span className="text-[10px] text-navy-400 font-medium">{event.time}</span>
                </div>
                <p className="text-xs text-navy-500 mt-0.5">{event.description}</p>
                <span className="text-[10px] text-navy-400 mt-0.5 block">by {event.actor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
