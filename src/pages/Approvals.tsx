import { useState, useMemo } from 'react';
import {
  CheckSquare, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  User, Clock, GitBranch, ShieldAlert, Info, DollarSign, FileText,
} from 'lucide-react';
import { GlassCard, SectionHeader, DemoBadge, Tooltip } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/States';
import { recoveryPlans, disruptions, APPROVAL_RULES, DEMO_USER } from '@/data/demoData';
import { formatCurrency, getCostTypeColor, getCostTypeLabel } from '@/utils/format';
import { useApp } from '@/context/AppContext';
import type { RecoveryPlan, PlanApprovalStatus } from '@/types';

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

type ConfirmAction = { type: 'approve' | 'reject'; plan: RecoveryPlan } | null;

export function ApprovalsPage() {
  const { approvedPlans, rejectedPlans, approvePlan, rejectPlan, addToast } = useApp();
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [selectedPlan, setSelectedPlan] = useState<RecoveryPlan | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const getApprovalStatus = (plan: RecoveryPlan): PlanApprovalStatus => {
    if (approvedPlans.has(plan.id)) return 'Approved';
    if (rejectedPlans.has(plan.id)) return 'Rejected';
    return plan.approvalStatus;
  };

  const pendingPlans = useMemo(() => {
    return recoveryPlans.filter((p) => {
      const status = getApprovalStatus(p);
      return status === 'Pending Approval';
    });
  }, [approvedPlans, rejectedPlans]);

  const allPlans = useMemo(() => {
    return recoveryPlans.map((p) => ({ ...p, _status: getApprovalStatus(p) }));
  }, [approvedPlans, rejectedPlans]);

  const visiblePlans = tab === 'pending' ? pendingPlans : allPlans;

  const canApprove = (plan: RecoveryPlan): boolean => {
    if (plan.proposer === DEMO_USER.name) return false;
    if (plan.approvalStatus === 'Draft') return false;
    const status = getApprovalStatus(plan);
    return status === 'Pending Approval';
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'approve') {
      approvePlan(confirmAction.plan.id, confirmAction.plan.version);
    } else {
      rejectPlan(confirmAction.plan.id, confirmAction.plan.version);
    }
    setConfirmAction(null);
  };

  const isSelfProposed = (plan: RecoveryPlan): boolean => plan.proposer === DEMO_USER.name;

  return (
    <div className="space-y-5">
      {/* Business rules banner */}
      <GlassCard className="p-4 animate-slide-up border-amber-200/50">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-navy-800 mb-1">Approval Rules (Business Policy)</div>
            <ul className="space-y-1">
              {APPROVAL_RULES.map((rule, i) => (
                <li key={i} className="text-xs text-navy-500 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/50 border border-navy-100/50 w-fit">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${tab === 'pending' ? 'bg-electric-600 text-white shadow-glass-sm' : 'text-navy-500 hover:text-navy-800'}`}
        >
          Pending Review ({pendingPlans.length})
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${tab === 'all' ? 'bg-electric-600 text-white shadow-glass-sm' : 'text-navy-500 hover:text-navy-800'}`}
        >
          All Plans ({allPlans.length})
        </button>
      </div>

      {/* Plans list */}
      {visiblePlans.length === 0 ? (
        <GlassCard className="p-0">
          <EmptyState
            icon={<CheckSquare size={24} />}
            title={tab === 'pending' ? 'No plans pending approval' : 'No plans found'}
            description={tab === 'pending' ? 'All submitted plans have been reviewed.' : undefined}
          />
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {visiblePlans.map((plan, i) => {
            const status = getApprovalStatus(plan);
            const selfProposed = isSelfProposed(plan);
            const approvable = canApprove(plan);
            const linkedDisruption = disruptions.find((d) => d.id === plan.disruptionId);

            return (
              <GlassCard key={plan.id} className="p-5 animate-slide-up">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Plan info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-bold text-navy-900">{plan.id}</span>
                      <Badge variant="info">{plan.version}</Badge>
                      <Badge variant={approvalVariant[status]} dot>{status}</Badge>
                      <DemoBadge />
                    </div>
                    <p className="text-sm font-medium text-navy-700 mb-1">{plan.strategy}</p>
                    <p className="text-xs text-navy-500 leading-relaxed mb-3">{plan.description}</p>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      <div className="text-xs">
                        <span className="text-navy-400">Orders Protected</span>
                        <div className="font-semibold text-navy-700 tabular-nums">{plan.ordersProtected}</div>
                      </div>
                      <div className="text-xs">
                        <span className="text-navy-400">Total Cost</span>
                        <div className="font-semibold text-navy-700 tabular-nums">{formatCurrency(plan.totalCost)}</div>
                      </div>
                      <div className="text-xs">
                        <span className="text-navy-400">Risk</span>
                        <div><Badge variant={riskVariant[plan.riskLevel]} dot>{plan.riskLevel}</Badge></div>
                      </div>
                      <div className="text-xs">
                        <span className="text-navy-400">Validation</span>
                        <div><Badge variant={plan.validationStatus === 'Validated' ? 'success' : plan.validationStatus === 'Validation Failed' ? 'danger' : 'warning'} dot>{plan.validationStatus}</Badge></div>
                      </div>
                    </div>

                    {/* Proposer info */}
                    <div className="flex items-center gap-4 text-xs text-navy-400 mb-3">
                      <span className="flex items-center gap-1"><User size={12} /> {plan.proposer}</span>
                      {plan.submittedAt && <span className="flex items-center gap-1"><Clock size={12} /> {plan.submittedAt}</span>}
                      {linkedDisruption && <span>For: <span className="text-electric-600 font-medium">{linkedDisruption.id}</span></span>}
                    </div>

                    {/* Self-proposal warning */}
                    {selfProposed && status === 'Pending Approval' && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/60 border border-amber-100/50 mb-3">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                        <span className="text-xs text-amber-700 font-medium">
                          You proposed this plan — business rules prevent you from approving it. Another manager must review.
                        </span>
                      </div>
                    )}

                    {/* Draft warning */}
                    {plan.approvalStatus === 'Draft' && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-navy-50/60 border border-navy-100/50 mb-3">
                        <Info size={14} className="text-navy-500 shrink-0" />
                        <span className="text-xs text-navy-600 font-medium">
                          This plan is a draft and has not been submitted for approval yet.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:w-48 shrink-0 flex flex-row lg:flex-col gap-2 lg:justify-center">
                    <Button
                      variant="secondary"
                      size="md"
                      className="flex-1 lg:w-full"
                      onClick={() => setSelectedPlan(plan)}
                      icon={<FileText size={15} />}
                    >
                      Review Plan
                    </Button>
                    {tab === 'pending' && status === 'Pending Approval' && (
                      <>
                        <Button
                          variant="success"
                          size="md"
                          className="flex-1 lg:w-full"
                          disabled={!approvable}
                          onClick={() => setConfirmAction({ type: 'approve', plan })}
                          icon={<CheckCircle2 size={15} />}
                          title={!approvable && selfProposed ? 'You cannot approve your own plan' : undefined}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="md"
                          className="flex-1 lg:w-full"
                          disabled={!approvable}
                          onClick={() => setConfirmAction({ type: 'reject', plan })}
                          icon={<XCircle size={15} />}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} approvalStatus={selectedPlan ? getApprovalStatus(selectedPlan) : null} />

      {/* Confirm Dialog */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant={confirmAction?.type === 'approve' ? 'success' : 'danger'}
              onClick={handleConfirm}
              icon={confirmAction?.type === 'approve' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            >
              {confirmAction?.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
            </Button>
          </>
        }
      >
        {confirmAction && (
          <div className="space-y-3">
            <DemoBadge />
            <p className="text-sm text-navy-700">
              Are you sure you want to {confirmAction.type === 'approve' ? 'approve' : 'reject'} plan{' '}
              <span className="font-bold">{confirmAction.plan.id} {confirmAction.plan.version}</span> ({confirmAction.plan.strategy})?
            </p>
            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100/50">
              <p className="text-xs text-amber-700 font-medium">
                This is a DEMO action. No real approval will be recorded on any backend system.
              </p>
            </div>
            {confirmAction.type === 'approve' && (
              <div className="p-3 rounded-lg bg-electric-50/40 border border-electric-100/50">
                <p className="text-xs text-navy-600">
                  Once approved, this version becomes the only executable plan for its linked disruption. Any subsequent modification will invalidate this approval.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ReviewModal({
  plan, onClose, approvalStatus,
}: {
  plan: RecoveryPlan | null;
  onClose: () => void;
  approvalStatus: PlanApprovalStatus | null;
}) {
  if (!plan || !approvalStatus) return null;
  const linkedDisruption = disruptions.find((d) => d.id === plan.disruptionId);
  const alternatives = recoveryPlans.filter((p) => p.disruptionId === plan.disruptionId && p.id !== plan.id);

  return (
    <Modal
      open={!!plan}
      onClose={onClose}
      title={`Review: ${plan.id} ${plan.version}`}
      subtitle={plan.strategy}
      size="xl"
      footer={<Button variant="secondary" onClick={onClose}>Close Review</Button>}
    >
      <div className="space-y-5">
        {/* Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={approvalVariant[approvalStatus]} dot>{approvalStatus}</Badge>
          <Badge variant={plan.validationStatus === 'Validated' ? 'success' : plan.validationStatus === 'Validation Failed' ? 'danger' : 'warning'} dot>{plan.validationStatus}</Badge>
          <Badge variant={riskVariant[plan.riskLevel]}>Risk: {plan.riskLevel}</Badge>
          <DemoBadge />
        </div>

        <p className="text-sm text-navy-600 leading-relaxed">{plan.description}</p>

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

        {/* Alternatives comparison */}
        {alternatives.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GitBranch size={15} className="text-navy-500" />
              <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Alternative Plans</span>
            </div>
            <div className="space-y-2">
              {alternatives.map((alt) => (
                <div key={alt.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-navy-100/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-navy-800">{alt.id}</span>
                      <Badge variant="info">{alt.version}</Badge>
                    </div>
                    <span className="text-xs text-navy-500">{alt.strategy}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-navy-500">{formatCurrency(alt.totalCost)}</span>
                    <Badge variant={riskVariant[alt.riskLevel]}>{alt.riskLevel}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Version history */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={15} className="text-navy-500" />
            <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Version History</span>
          </div>
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-navy-200" />
            <div className="space-y-3">
              {plan.versionHistory.map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white
                    ${v.version === plan.version ? 'border-electric-400' : 'border-navy-300'}`}>
                    {v.version === plan.version && <div className="w-2 h-2 rounded-full bg-electric-500" />}
                  </div>
                  <div>
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

        {linkedDisruption && (
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">
                Linked to disruption {linkedDisruption.id}. Only the currently approved version can be executed.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
