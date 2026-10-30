import { useState, useMemo } from 'react';
import {
  ShieldCheck, Search, ArrowRight, FileText, GitBranch,
  AlertCircle, CheckCircle2, XCircle, Info, DollarSign, AlertTriangle, Clock,
} from 'lucide-react';
import { GlassCard, SectionHeader, DemoBadge, Tooltip } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/States';
import { recoveryPlans, disruptions } from '@/data/demoData';
import { formatCurrency, getCostTypeColor, getCostTypeLabel } from '@/utils/format';
import { useApp } from '@/context/AppContext';
import type { RecoveryPlan, PlanValidationStatus, PlanApprovalStatus } from '@/types';

interface RecoveryPlansPageProps {
  selectedPlanId: string | null;
  onSelectPlan: (id: string | null) => void;
  onNavigate: (page: PageId) => void;
}

import type { PageId } from '@/components/layout/Sidebar';

const validationVariant: Record<PlanValidationStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  'Validated': 'success',
  'Pending Validation': 'warning',
  'Validation Failed': 'danger',
  'Stale': 'neutral',
};

const approvalVariant: Record<PlanApprovalStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  'Approved': 'success',
  'Pending Approval': 'warning',
  'Rejected': 'danger',
  'Draft': 'neutral',
  'Superseded': 'info',
};

const riskVariant: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
  Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low',
};

export function RecoveryPlansPage({ selectedPlanId, onSelectPlan }: RecoveryPlansPageProps) {
  const { approvedPlans, rejectedPlans } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const getApprovalStatus = (plan: RecoveryPlan): PlanApprovalStatus => {
    if (approvedPlans.has(plan.id)) return 'Approved';
    if (rejectedPlans.has(plan.id)) return 'Rejected';
    return plan.approvalStatus;
  };

  const filtered = useMemo(() => {
    return recoveryPlans.filter((p) => {
      if (search && !p.id.toLowerCase().includes(search.toLowerCase()) &&
          !p.strategy.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && getApprovalStatus(p) !== statusFilter) return false;
      if (riskFilter && p.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [search, statusFilter, riskFilter, approvedPlans, rejectedPlans]);

  const selectedPlan = recoveryPlans.find((p) => p.id === selectedPlanId) || null;
  const comparePlans = recoveryPlans.filter((p) => compareIds.includes(p.id));

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

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
              placeholder="Search plan ID or strategy…"
              className="glass-input w-full h-10 rounded-xl text-sm pl-10 pr-3"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Approval Statuses"
            options={[
              { value: 'Approved', label: 'Approved' },
              { value: 'Pending Approval', label: 'Pending Approval' },
              { value: 'Rejected', label: 'Rejected' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Superseded', label: 'Superseded' },
            ]}
            className="w-full sm:w-48"
          />
          <Select
            value={riskFilter}
            onChange={setRiskFilter}
            placeholder="All Risk Levels"
            options={[
              { value: 'Critical', label: 'Critical' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
            className="w-full sm:w-40"
          />
        </div>
      </GlassCard>

      {/* Comparison bar */}
      {compareIds.length > 0 && (
        <GlassCard className="p-4 animate-slide-up flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-electric-600" />
            <span className="text-sm font-medium text-navy-700">
              Comparing {compareIds.length} plan{compareIds.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              {compareIds.map((id) => (
                <Badge key={id} variant="info">{id}</Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setCompareIds([])}>Clear</Button>
          </div>
        </GlassCard>
      )}

      {/* Plans grid */}
      {filtered.length === 0 ? (
        <GlassCard className="p-0">
          <EmptyState icon={<ShieldCheck size={24} />} title="No recovery plans found" description="Try adjusting your filters." />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((plan, i) => (
            <RecoveryPlanCard
              key={plan.id}
              plan={plan}
              approvalStatus={getApprovalStatus(plan)}
              onView={() => onSelectPlan(plan.id)}
              onCompare={() => toggleCompare(plan.id)}
              isComparing={compareIds.includes(plan.id)}
              compareDisabled={compareIds.length >= 3 && !compareIds.includes(plan.id)}
              delay={i * 100}
            />
          ))}
        </div>
      )}

      {/* Comparison table */}
      {comparePlans.length >= 2 && (
        <GlassCard className="p-5 animate-slide-up">
          <SectionHeader title="Plan Comparison" subtitle="Side-by-side comparison of selected plans" icon={<GitBranch size={18} />} action={<DemoBadge />} />
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100/70">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Attribute</th>
                  {comparePlans.map((p) => (
                    <th key={p.id} className="text-left px-4 py-3 text-xs font-semibold text-navy-700">{p.id} {p.version}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50/50">
                {[
                  { label: 'Strategy', get: (p: RecoveryPlan) => p.strategy },
                  { label: 'Orders Protected', get: (p: RecoveryPlan) => p.ordersProtected.toString() },
                  { label: 'Total Cost (Synthetic)', get: (p: RecoveryPlan) => formatCurrency(p.totalCost) },
                  { label: 'Risk Level', get: (p: RecoveryPlan) => p.riskLevel },
                  { label: 'Validation', get: (p: RecoveryPlan) => p.validationStatus },
                  { label: 'Approval', get: (p: RecoveryPlan) => getApprovalStatus(p) },
                  { label: 'Assumptions', get: (p: RecoveryPlan) => `${p.assumptions.length} assumptions` },
                  { label: 'Risks Identified', get: (p: RecoveryPlan) => `${p.risks.length} risks` },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">{row.label}</td>
                    {comparePlans.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-navy-700 text-sm">{row.get(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Plan Detail Modal */}
      <PlanDetailModal
        plan={selectedPlan}
        onClose={() => onSelectPlan(null)}
        approvalStatus={selectedPlan ? getApprovalStatus(selectedPlan) : null}
      />
    </div>
  );
}

function RecoveryPlanCard({
  plan, approvalStatus, onView, onCompare, isComparing, compareDisabled, delay,
}: {
  plan: RecoveryPlan;
  approvalStatus: PlanApprovalStatus;
  onView: () => void;
  onCompare: () => void;
  isComparing: boolean;
  compareDisabled: boolean;
  delay: number;
}) {
  const linkedDisruption = disruptions.find((d) => d.id === plan.disruptionId);

  return (
    <GlassCard className="p-5 animate-slide-up flex flex-col" >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-navy-900">{plan.id}</span>
            <Badge variant="info">{plan.version}</Badge>
            <DemoBadge />
          </div>
          <p className="text-xs text-navy-500 mt-0.5">{plan.strategy}</p>
        </div>
        <button
          onClick={onCompare}
          disabled={compareDisabled}
          className={`text-xs font-medium px-2 py-1 rounded-lg border transition-colors
            ${isComparing ? 'bg-electric-50 border-electric-200 text-electric-700' :
              compareDisabled ? 'bg-navy-50 border-navy-100 text-navy-300 cursor-not-allowed' :
              'bg-white/60 border-navy-100 text-navy-500 hover:bg-white/90'}`}
        >
          {isComparing ? '✓ Comparing' : 'Compare'}
        </button>
      </div>

      <p className="text-xs text-navy-500 leading-relaxed mb-3 flex-1">{plan.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-navy-400">Orders Protected</span>
          <span className="font-semibold text-navy-700 tabular-nums">{plan.ordersProtected}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-navy-400">
            Total Cost
            <Tooltip text="All costs are synthetic demo values. See cost breakdown for type labels.">
              <span className="ml-1 text-navy-300 cursor-help underline decoration-dotted">?</span>
            </Tooltip>
          </span>
          <span className="font-semibold text-navy-700 tabular-nums">{formatCurrency(plan.totalCost)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-navy-400">Risk Level</span>
          <Badge variant={riskVariant[plan.riskLevel]} dot>{plan.riskLevel}</Badge>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-navy-400">Validation</span>
          <Badge variant={validationVariant[plan.validationStatus]} dot>{plan.validationStatus}</Badge>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-navy-400">Approval</span>
          <Badge variant={approvalVariant[approvalStatus]} dot>{approvalStatus}</Badge>
        </div>
      </div>

      {linkedDisruption && (
        <div className="text-xs text-navy-400 mb-3">
          For disruption: <span className="text-electric-600 font-medium">{linkedDisruption.id}</span>
        </div>
      )}

      <Button variant="primary" size="md" className="w-full" onClick={onView} icon={<ArrowRight size={15} />}>
        View Plan
      </Button>
    </GlassCard>
  );
}

function PlanDetailModal({
  plan, onClose, approvalStatus,
}: {
  plan: RecoveryPlan | null;
  onClose: () => void;
  approvalStatus: PlanApprovalStatus | null;
}) {
  if (!plan || !approvalStatus) return null;
  const linkedDisruption = disruptions.find((d) => d.id === plan.disruptionId);

  return (
    <Modal
      open={!!plan}
      onClose={onClose}
      title={`${plan.id} ${plan.version}`}
      subtitle={plan.strategy}
      size="xl"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-5">
        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={approvalVariant[approvalStatus]} dot>{approvalStatus}</Badge>
          <Badge variant={validationVariant[plan.validationStatus]} dot>{plan.validationStatus}</Badge>
          <Badge variant={riskVariant[plan.riskLevel]}>Risk: {plan.riskLevel}</Badge>
          <DemoBadge />
        </div>

        <p className="text-sm text-navy-600 leading-relaxed">{plan.description}</p>

        {/* Key details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
            <ShieldCheck size={16} className="text-emerald-500 mb-1.5" />
            <div className="text-lg font-bold text-navy-900 tabular-nums">{plan.ordersProtected}</div>
            <div className="text-[11px] text-navy-400">Orders Protected</div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
            <DollarSign size={16} className="text-electric-500 mb-1.5" />
            <div className="text-lg font-bold text-navy-900 tabular-nums">{formatCurrency(plan.totalCost)}</div>
            <div className="text-[11px] text-navy-400">Total Cost (Synthetic)</div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
            <FileText size={16} className="text-navy-500 mb-1.5" />
            <div className="text-sm font-bold text-navy-900">{plan.proposer}</div>
            <div className="text-[11px] text-navy-400">Proposed By</div>
          </div>
        </div>

        {/* Cost breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={15} className="text-electric-600" />
            <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Cost Breakdown</span>
            <DemoBadge />
          </div>
          <div className="space-y-2">
            {plan.costBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/50 border border-navy-100/40">
                <span className="text-sm text-navy-700">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy-800 tabular-nums">{formatCurrency(item.amount)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getCostTypeColor(item.type)}`}>
                    {getCostTypeLabel(item.type)}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 rounded-lg bg-electric-50/40 border border-electric-100/50">
              <span className="text-sm font-semibold text-navy-800">Total</span>
              <span className="text-base font-bold text-navy-900 tabular-nums">{formatCurrency(plan.totalCost)}</span>
            </div>
          </div>
        </div>

        {/* Assumptions */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info size={15} className="text-electric-600" />
            <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Assumptions</span>
          </div>
          <ul className="space-y-1.5">
            {plan.assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-navy-600">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-400 mt-1.5 shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-amber-600" />
            <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Identified Risks</span>
          </div>
          <ul className="space-y-1.5">
            {plan.risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-navy-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Approval info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
            <div className="text-[10px] text-navy-400 uppercase tracking-wider mb-1">Submitted</div>
            <div className="text-sm font-medium text-navy-700">{plan.submittedAt || 'Not submitted'}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-navy-100/50">
            <div className="text-[10px] text-navy-400 uppercase tracking-wider mb-1">Approved By</div>
            <div className="text-sm font-medium text-navy-700">{plan.approvedBy || 'Not approved'}</div>
            {plan.approvedAt && <div className="text-xs text-navy-400 mt-0.5">{plan.approvedAt}</div>}
          </div>
        </div>

        {/* Version history */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={15} className="text-navy-500" />
            <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Version History</span>
            <DemoBadge />
          </div>
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-navy-200" />
            <div className="space-y-4">
              {plan.versionHistory.map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white
                    ${v.version === plan.version ? 'border-electric-400' : 'border-navy-300'}`}>
                    {v.version === plan.version && <div className="w-2 h-2 rounded-full bg-electric-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={v.version === plan.version ? 'info' : 'neutral'}>{v.version}</Badge>
                      <span className="text-xs text-navy-400">{v.date}</span>
                    </div>
                    <p className="text-xs text-navy-500 mt-0.5">{v.changes}</p>
                    <span className="text-[10px] text-navy-400">by {v.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Business rule note */}
        {linkedDisruption && (
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">
                This plan is linked to disruption {linkedDisruption.id}. Only the currently approved version can be executed.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
