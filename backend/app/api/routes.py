"""FastAPI routes for the Decision Intelligence API."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..engine import (
    DisruptionNotFoundError,
    analyze_disruption,
    compare_options,
    execute_plan as engine_execute_plan,
    generate_recovery_options,
    score_orders,
    submit_plan as engine_submit_plan,
    approve_plan as engine_approve_plan,
)
from ..engine.explainer import (
    explain_disruption,
    explain_missing_data,
    explain_recovery,
    explain_risk,
)
from ..llm import create_provider
from ..data import get_disruption, get_shipments_for_disruption
from ..schemas import (
    AffectedOrderSummary,
    AffectedOrdersResponse,
    AnalyzeDisruptionRequest,
    AnalyzeDisruptionResponse,
    ApprovePlanRequest,
    ErrorResponse,
    ExecutePlanRequest,
    ExplainRequest,
    ExplainResponse,
    PlanActionResponse,
    RecommendRecoveryRequest,
    RecommendRecoveryResponse,
    SubmitPlanRequest,
)

router = APIRouter(prefix="/api/decision", tags=["Decision Intelligence"])


@router.post(
    "/analyze-disruption",
    response_model=AnalyzeDisruptionResponse,
    summary="Analyze a disruption and score affected orders",
)
def analyze_disruption_endpoint(req: AnalyzeDisruptionRequest):
    try:
        disruption, affected, risk_scores = analyze_disruption(req.disruption_id)
    except DisruptionNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                error="not_found",
                detail=f"Disruption '{req.disruption_id}' does not exist.",
                code="DISRUPTION_NOT_FOUND",
            ).model_dump(),
        )

    llm = create_provider()
    llm_summary = None
    if req.include_llm_summary and llm.available:
        summary_text, _, _ = explain_disruption(disruption, affected, llm)
        llm_summary = summary_text

    order_summaries = [
        AffectedOrderSummary(
            order_id=s.order_id,
            shipment_id=s.id,
            destination=s.destination,
            priority=s.priority.value,
            status=s.status.value,
            delay_risk=s.delay_risk,
            customer_impact=s.customer_impact,
            is_cold_chain=s.is_cold_chain,
        )
        for s in affected
    ]

    return AnalyzeDisruptionResponse(
        disruption=disruption,
        affected_shipments=affected,
        affected_orders=order_summaries,
        risk_scores=risk_scores,
        llm_summary=llm_summary,
        llm_available=llm.available,
    )


@router.get(
    "/affected-orders/{disruption_id}",
    response_model=AffectedOrdersResponse,
    summary="Get risk-ranked affected orders for a disruption",
)
def get_affected_orders(disruption_id: str):
    disruption = get_disruption(disruption_id)
    if disruption is None:
        return AffectedOrdersResponse(
            disruption_id=disruption_id,
            disruption_exists=False,
            affected_orders=[],
            risk_scores=[],
            total_orders=0,
        )

    affected = get_shipments_for_disruption(disruption_id)
    risk_scores = score_orders(affected, disruption)

    order_summaries = [
        AffectedOrderSummary(
            order_id=s.order_id,
            shipment_id=s.id,
            destination=s.destination,
            priority=s.priority.value,
            status=s.status.value,
            delay_risk=s.delay_risk,
            customer_impact=s.customer_impact,
            is_cold_chain=s.is_cold_chain,
        )
        for s in affected
    ]

    return AffectedOrdersResponse(
        disruption_id=disruption_id,
        disruption_exists=True,
        affected_orders=order_summaries,
        risk_scores=risk_scores,
        total_orders=len(order_summaries),
    )


@router.post(
    "/recommend-recovery",
    response_model=RecommendRecoveryResponse,
    summary="Generate recovery plan recommendations for a disruption",
)
def recommend_recovery_endpoint(req: RecommendRecoveryRequest):
    try:
        disruption, affected, _ = analyze_disruption(req.disruption_id)
    except DisruptionNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                error="not_found",
                detail=f"Disruption '{req.disruption_id}' does not exist.",
                code="DISRUPTION_NOT_FOUND",
            ).model_dump(),
        )

    options = generate_recovery_options(disruption, affected, req.include_infeasible)
    comparison = compare_options(options)

    llm = create_provider()
    llm_explanation = None
    if req.include_llm_explanation and llm.available:
        text, _, _ = explain_recovery(options, comparison, llm)
        llm_explanation = text

    return RecommendRecoveryResponse(
        disruption_id=req.disruption_id,
        options=options,
        comparison=comparison,
        llm_tradeoff_explanation=llm_explanation,
        llm_available=llm.available,
    )


@router.post(
    "/explain",
    response_model=ExplainResponse,
    summary="Generate a plain-English explanation for risk, disruption, recovery, or missing data",
)
def explain_endpoint(req: ExplainRequest):
    llm = create_provider() if req.use_llm else None
    valid_topics = {"risk", "disruption", "recovery", "missing_data"}
    if req.topic not in valid_topics:
        raise HTTPException(
            status_code=422,
            detail=ErrorResponse(
                error="validation_error",
                detail=f"Topic must be one of: {', '.join(sorted(valid_topics))}.",
                code="INVALID_TOPIC",
            ).model_dump(),
        )

    # Resolve disruption
    disruption_id = req.disruption_id or "DIS-2026-0417"
    disruption = get_disruption(disruption_id)
    if disruption is None:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                error="not_found",
                detail=f"Disruption '{disruption_id}' does not exist.",
                code="DISRUPTION_NOT_FOUND",
            ).model_dump(),
        )

    affected = get_shipments_for_disruption(disruption_id)
    risk_scores = score_orders(affected, disruption)

    if req.topic == "risk":
        explanation, source, caveats = explain_risk(
            disruption, affected, risk_scores, req.order_id, llm,
        )
    elif req.topic == "disruption":
        explanation, source, caveats = explain_disruption(disruption, affected, llm)
    elif req.topic == "recovery":
        options = generate_recovery_options(disruption, affected)
        comparison = compare_options(options)
        explanation, source, caveats = explain_recovery(options, comparison, llm)
    elif req.topic == "missing_data":
        options = generate_recovery_options(disruption, affected)
        explanation, source, caveats = explain_missing_data(
            disruption, risk_scores, options, llm,
        )
    else:
        explanation = "Unknown topic."
        source = "deterministic"
        caveats = []

    return ExplainResponse(
        topic=req.topic,
        explanation=explanation,
        source=source,
        llm_available=llm.available if llm else False,
        caveats=caveats,
    )


# ─── Plan lifecycle endpoints (business rule enforcement) ──────────────


@router.post(
    "/submit-plan",
    response_model=PlanActionResponse,
    summary="Submit a recovery plan for approval (business rule: must be submitted before approval)",
)
def submit_plan_endpoint(req: SubmitPlanRequest):
    record = engine_submit_plan(req.plan_id, req.version, req.proposer_id)
    return PlanActionResponse(
        success=True,
        plan_id=req.plan_id,
        version=req.version,
        action="submitted",
        message=f"Plan {req.plan_id} {req.version} submitted by {req.proposer_id} (DEMO — not persisted to a database).",
    )


@router.post(
    "/approve-plan",
    response_model=PlanActionResponse,
    summary="Approve a recovery plan (enforces business rules)",
)
def approve_plan_endpoint(req: ApprovePlanRequest):
    success, violations = engine_approve_plan(
        req.plan_id, req.version, req.approver_id,
    )
    if success:
        return PlanActionResponse(
            success=True,
            plan_id=req.plan_id,
            version=req.version,
            action="approved",
            message=f"Plan {req.plan_id} {req.version} approved by {req.approver_id} (DEMO).",
        )
    else:
        return PlanActionResponse(
            success=False,
            plan_id=req.plan_id,
            version=req.version,
            action="approval_blocked",
            message=f"Approval blocked by business rule(s): {', '.join(violations)}",
            violations=violations,
        )


@router.post(
    "/execute-plan",
    response_model=PlanActionResponse,
    summary="Execute an approved recovery plan (enforces all execution constraints)",
)
def execute_plan_endpoint(req: ExecutePlanRequest):
    success, violations = engine_execute_plan(
        req.plan_id, req.version, req.approver_id,
        revalidate=req.revalidate,
    )
    if success:
        return PlanActionResponse(
            success=True,
            plan_id=req.plan_id,
            version=req.version,
            action="executed",
            message=f"Plan {req.plan_id} {req.version} executed (DEMO — no real operations performed).",
        )
    else:
        return PlanActionResponse(
            success=False,
            plan_id=req.plan_id,
            version=req.version,
            action="execution_blocked",
            message=f"Execution blocked by business rule(s): {', '.join(violations)}",
            violations=violations,
        )
