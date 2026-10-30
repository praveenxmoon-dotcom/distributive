import { useState, useMemo } from 'react';
import {
  AlertTriangle, Package, CheckSquare, ShieldCheck, ArrowRight,
  Search, Filter, ChevronRight, AlertCircle,
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { RouteMap } from '@/components/dashboard/RouteMap';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { GlassCard, SectionHeader, DemoBadge, Tooltip } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/States';
import {
  disruptions, shipments, recoveryPlans, DEMO_USER,
} from '@/data/demoData';
import { useApp } from '@/context/AppContext';
import type { PageId } from '@/components/layout/Sidebar';
import type { Shipment, RecoveryPlan } from '@/types';

interface OverviewProps {
  onNavigate: (page: PageId) => void;
  onSelectDisruption: (id: string) => void;
  onSelectPlan: (id: string) => void;
}

const priorityVariant: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
  Urgent: 'critical', High: 'high', Medium: 'medium', Low: 'low',
};

export function Overview({ onNavigate, onSelectDisruption, onSelectPlan }: OverviewProps) {
  const { approvedPlans, rejectedPlans } = useApp();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const activeDisruption = disruptions[0];
  const activeDisruptionsCount = disruptions.filter((d) => d.status === 'Active').length;
  const totalAffectedOrders = disruptions.reduce((s, d) => s + d.affectedOrders, 0);
  const pendingApprovalsCount = recoveryPlans.filter(
    (p) => p.approvalStatus === 'Pending Approval' && !approvedPlans.has(p.id) && !rejectedPlans.has(p.id)
  ).length;
  const recoveryInProgressCount = recoveryPlans.filter(
    (p) => p.approvalStatus === 'Pending Approval' || p.validationStatus === 'Pending Validation'
  ).length;

  const riskRankedOrders = useMemo(() => {
    return shipments
      .filter((s) => s.delayRisk > 0)
      .sort((a, b) => b.delayRisk - a.delayRisk);
  }, []);

  const filteredOrders = useMemo(() => {
    return riskRankedOrders.filter((s) => {
      if (search && !s.id.toLowerCase().includes(search.toLowerCase()) &&
          !s.orderId.toLowerCase().includes(search.toLowerCase()) &&
          !s.destination.toLowerCase().includes(search.toLowerCase())) return false;
      if (priorityFilter && s.priority !== priorityFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      return true;
    });
  }, [riskRankedOrders, search, priorityFilter, statusFilter]);

  const pendingPlans = recoveryPlans.filter(
    (p) => p.approvalStatus === 'Pending Approval' && !approvedPlans.has(p.id) && !rejectedPlans.has(p.id)
  );

  const orderColumns: Column<Shipment>[] = [
    {
      key: 'orderId', label: 'Order ID', sortable: true,
      sortValue: (r) => r.orderId,
      render: (r) => <span className="font-semibold text-navy-800">{r.orderId}</span>,
    },
    {
      key: 'destination', label: 'Destination', sortable: true,
      sortValue: (r) => r.destination,
      render: (r) => <span className="text-navy-600">{r.destination}</span>,
    },
    {
      key: 'priority', label: 'Priority', sortable: true,
      sortValue: (r) => r.priority,
      render: (r) => <Badge variant={priorityVariant[r.priority]} dot>{r.priority}</Badge>,
    },
    {
      key: 'delayRisk', label: 'Delay Risk', sortable: true,
      sortValue: (r) => r.delayRisk,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-navy-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${r.delayRisk >= 80 ? 'bg-red-500' : r.delayRisk >= 50 ? 'bg-amber-500' : 'bg-electric-500'}`}
              style={{ width: `${r.delayRisk}%` }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums text-navy-700">{r.delayRisk}%</span>
        </div>
      ),
    },
    {
      key: 'customerImpact', label: 'Customer Impact',
      render: (r) => <span className="text-xs text-navy-500">{r.customerImpact}</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      sortValue: (r) => r.status,
      render: (r) => <Badge variant={r.status === 'Delivered' ? 'success' : r.status === 'Held' ? 'warning' : r.status === 'Delayed' ? 'danger' : 'info'}>{r.status}</Badge>,
    },
    {
      key: 'action', label: 'Recommended Action',
      render: (r) => {
        const action = r.delayRisk >= 80 ? 'Reroute urgently' : r.delayRisk >= 50 ? 'Review recovery plan' : 'Monitor';
        return <span className="text-xs font-medium text-electric-600">{action}</span>;
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Active Disruptions"
          value={activeDisruptionsCount}
          icon={<AlertTriangle size={20} />}
          accent="rose"
          trend={{ direction: 'up', value: '+1' }}
          trendLabel="vs. yesterday"
          tooltip="Disruptions currently impacting shipments"
        />
        <KPICard
          label="Affected Orders"
          value={totalAffectedOrders}
          icon={<Package size={20} />}
          accent="amber"
          trend={{ direction: 'up', value: '+12' }}
          trendLabel="across all disruptions"
          tooltip="Total orders impacted by active disruptions"
        />
        <KPICard
          label="Pending Approvals"
          value={pendingApprovalsCount}
          icon={<CheckSquare size={20} />}
          accent="electric"
          trend={{ direction: 'neutral', value: '0' }}
          trendLabel="awaiting manager review"
          tooltip="Recovery plans waiting for approval"
        />
        <KPICard
          label="Recovery in Progress"
          value={recoveryInProgressCount}
          icon={<ShieldCheck size={20} />}
          accent="emerald"
          trend={{ direction: 'up', value: '+2' }}
          trendLabel="plans being processed"
          tooltip="Plans in validation or approval workflow"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Route map + Pending approvals */}
        <div className="space-y-5">
          <RouteMap disruption={activeDisruption} onView={() => onSelectDisruption(activeDisruption.id)} />

          {/* Pending Approvals */}
          <GlassCard className="p-5 animate-slide-up animate-delay-200">
            <SectionHeader
              title="Pending Approvals"
              subtitle="Plans awaiting manager review"
              icon={<CheckSquare size={18} />}
              action={<DemoBadge />}
            />
            {pendingPlans.length === 0 ? (
              <EmptyState title="No pending approvals" description="All submitted plans have been reviewed." />
            ) : (
              <div className="space-y-3">
                {pendingPlans.map((plan) => (
                  <div key={plan.id} className="p-3 rounded-xl bg-white/50 border border-navy-100/50 hover:bg-white/70 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-navy-800">{plan.id}</span>
                          <Badge variant="info">{plan.version}</Badge>
                        </div>
                        <span className="text-xs text-navy-500">{plan.strategy}</span>
                      </div>
                      <Badge variant="warning" dot>Pending</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-navy-400 mb-2.5">
                      <span>by {plan.proposer}</span>
                      <span>{plan.submittedAt}</span>
                    </div>
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => onNavigate('approvals')} icon={<ArrowRight size={13} />}>
                      Review Plan
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right: Risk-ranked orders + Recovery plans + Activity */}
        <div className="lg:col-span-2 space-y-5">
          {/* Risk-Ranked Orders */}
          <GlassCard className="p-5 animate-slide-up animate-delay-100">
            <SectionHeader
              title="Risk-Ranked Orders"
              subtitle="Orders sorted by delay risk and customer impact"
              icon={<AlertCircle size={18} />}
              action={<DemoBadge />}
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order ID or destination…"
                  className="glass-input w-full h-9 rounded-xl text-sm pl-10 pr-3"
                />
              </div>
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
            </div>

            <GlassCard className="p-0 overflow-hidden">
              <DataTable
                columns={orderColumns}
                data={filteredOrders}
                rowKey={(r) => r.id}
                emptyMessage="No orders match your filters"
                emptyDescription="Try adjusting search or filter criteria."
              />
            </GlassCard>
          </GlassCard>

          {/* Recovery Plans Comparison */}
          <GlassCard className="p-5 animate-slide-up animate-delay-200">
            <SectionHeader
              title="Recovery Plans"
              subtitle="Comparison of recovery options for the active disruption"
              icon={<ShieldCheck size={18} />}
              action={
                <Button size="sm" variant="ghost" onClick={() => onNavigate('recovery')} icon={<ChevronRight size={14} />}>
                  View All
                </Button>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recoveryPlans.slice(0, 3).map((plan) => (
                <PlanComparisonCard key={plan.id} plan={plan} onView={() => onSelectPlan(plan.id)} />
              ))}
            </div>
          </GlassCard>

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

function PlanComparisonCard({ plan, onView }: { plan: RecoveryPlan; onView: () => void }) {
  const { approvedPlans, rejectedPlans } = useApp();
  const isApproved = approvedPlans.has(plan.id);
  const isRejected = rejectedPlans.has(plan.id);

  const approvalStatus = isApproved ? 'Approved' : isRejected ? 'Rejected' : plan.approvalStatus;
  const approvalVariant = isApproved ? 'success' : isRejected ? 'danger' :
    plan.approvalStatus === 'Approved' ? 'success' :
    plan.approvalStatus === 'Rejected' ? 'danger' :
    plan.approvalStatus === 'Draft' ? 'neutral' : 'warning';

  return (
    <div className="p-4 rounded-xl bg-white/50 border border-navy-100/50 hover:bg-white/70 hover:border-electric-200/60 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-navy-800">{plan.id}</span>
            <Badge variant="info">{plan.version}</Badge>
          </div>
          <p className="text-xs text-navy-500 mt-0.5">{plan.strategy}</p>
        </div>
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-navy-400">Orders Protected</span>
          <span className="font-semibold text-navy-700 tabular-nums">{plan.ordersProtected}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-navy-400">
            Est. Cost
            <Tooltip text="All costs are synthetic demo values. Confirmed costs are marked separately.">
              <span className="ml-1 text-navy-300 cursor-help underline decoration-dotted">?</span>
            </Tooltip>
          </span>
          <span className="font-semibold text-navy-700 tabular-nums">₹{plan.totalCost.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-navy-400">Risk Level</span>
          <Badge variant={plan.riskLevel === 'Critical' ? 'critical' : plan.riskLevel === 'High' ? 'high' : plan.riskLevel === 'Medium' ? 'medium' : 'low'}>
            {plan.riskLevel}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-navy-400">Validation</span>
          <Badge variant={plan.validationStatus === 'Validated' ? 'success' : plan.validationStatus === 'Validation Failed' ? 'danger' : plan.validationStatus === 'Stale' ? 'neutral' : 'warning'}>
            {plan.validationStatus}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-navy-400">Approval</span>
          <Badge variant={approvalVariant} dot>{approvalStatus}</Badge>
        </div>
      </div>
      <Button size="sm" variant="secondary" className="w-full" onClick={onView} icon={<ArrowRight size={13} />}>
        View Plan
      </Button>
    </div>
  );
}
