"""Pydantic request and response schemas for the Decision Intelligence API."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from .models import (
    CostBreakdownItem,
    Disruption,
    DisruptionSeverity,
    InventoryItem,
    PlanApprovalStatus,
    PlanValidationStatus,
    RecoveryComparison,
    RecoveryOption,
    RiskLevel,
    RiskScore,
    Shipment,
    Supplier,
)


# ─── Disruption Analysis ───────────────────────────────────────────────


class AnalyzeDisruptionRequest(BaseModel):
    disruption_id: str = Field(..., description="ID of the disruption to analyze")
    include_llm_summary: bool = Field(
        False, description="If true, request an LLM-generated summary (requires provider config)"
    )


class AffectedOrderSummary(BaseModel):
    order_id: str
    shipment_id: str
    destination: str
    priority: str
    status: str
    delay_risk: int
    customer_impact: str
    is_cold_chain: bool


class AnalyzeDisruptionResponse(BaseModel):
    disruption: Disruption
    affected_shipments: list[Shipment]
    affected_orders: list[AffectedOrderSummary]
    risk_scores: list[RiskScore]
    llm_summary: Optional[str] = None
    llm_available: bool = False
    synthetic: bool = True
    note: str = "All data is synthetic and for demo purposes only."


# ─── Affected Orders ───────────────────────────────────────────────────


class AffectedOrdersResponse(BaseModel):
    disruption_id: str
    disruption_exists: bool
    affected_orders: list[AffectedOrderSummary]
    risk_scores: list[RiskScore]
    total_orders: int
    synthetic: bool = True


# ─── Recovery Recommendations ──────────────────────────────────────────


class RecommendRecoveryRequest(BaseModel):
    disruption_id: str = Field(..., description="ID of the disruption to generate recovery plans for")
    include_infeasible: bool = Field(
        True, description="If true, include infeasible options with rejection reasons"
    )
    include_llm_explanation: bool = Field(
        False, description="If true, request an LLM-generated trade-off explanation"
    )


class RecommendRecoveryResponse(BaseModel):
    disruption_id: str
    options: list[RecoveryOption]
    comparison: RecoveryComparison
    llm_tradeoff_explanation: Optional[str] = None
    llm_available: bool = False
    synthetic: bool = True
    note: str = "All costs are synthetic estimates. No real reservations are made."


# ─── Explain ───────────────────────────────────────────────────────────


class ExplainRequest(BaseModel):
    topic: str = Field(
        ...,
        description="What to explain: 'risk', 'disruption', 'recovery', or 'missing_data'",
    )
    disruption_id: Optional[str] = None
    order_id: Optional[str] = None
    plan_id: Optional[str] = None
    use_llm: bool = Field(
        False, description="If true and an LLM provider is configured, use it for the explanation"
    )


class ExplainResponse(BaseModel):
    topic: str
    explanation: str
    source: str = Field(description="'deterministic' or 'llm'")
    llm_available: bool = False
    confidence: str = "High"
    caveats: list[str] = Field(default_factory=list)


# ─── Plan Approval & Execution (business rule enforcement) ────────────


class SubmitPlanRequest(BaseModel):
    plan_id: str
    version: str
    proposer_id: str = Field(..., description="User ID of the person submitting the plan")


class ApprovePlanRequest(BaseModel):
    plan_id: str
    version: str
    approver_id: str = Field(..., description="User ID of the manager approving the plan")


class ExecutePlanRequest(BaseModel):
    plan_id: str
    version: str
    approver_id: str = Field(..., description="Authenticated user requesting execution")
    revalidate: bool = Field(
        True, description="If true, re-check inventory and constraints before execution"
    )


class PlanActionResponse(BaseModel):
    success: bool
    plan_id: str
    version: str
    action: str
    message: str
    violations: list[str] = Field(default_factory=list)
    synthetic: bool = True


# ─── Error ─────────────────────────────────────────────────────────────


class ErrorResponse(BaseModel):
    error: str
    detail: str
    code: str
