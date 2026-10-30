"""Explanation module.

Generates human-readable explanations for risk scores, disruption summaries,
recovery trade-offs, and missing data. Uses an LLM when available, but always
has a deterministic fallback so the system works without any LLM configured.

LLM output is treated as untrusted — it is never used for scoring, recovery
generation, or business rule enforcement. It only produces natural-language
explanations of data already computed by the deterministic engine.
"""
from __future__ import annotations

from typing import Optional

from ..data import get_disruption, get_shipments_for_disruption
from ..llm import LLMProvider, create_provider
from .disruption_analysis import analyze_disruption
from .recovery_engine import compare_options, generate_recovery_options
from .risk_engine import score_orders
from ..models import Disruption, RecoveryComparison, RecoveryOption, RiskScore, Shipment

SYSTEM_PROMPT = (
    "You are a supply chain disruption analyst assistant. You explain risk "
    "scores, disruption impacts, and recovery plan trade-offs in clear, "
    "plain English for a human operations manager. You NEVER make up data. "
    "You only work with the data provided to you. You always note when "
    "information is missing or synthetic. You do not recommend executing "
    "plans without human approval."
)


def explain_risk(
    disruption: Disruption,
    affected: list[Shipment],
    risk_scores: list[RiskScore],
    order_id: Optional[str] = None,
    llm: Optional[LLMProvider] = None,
) -> tuple[str, str, list[str]]:
    """Explain risk rankings. Returns (explanation, source, caveats)."""
    caveats = ["Risk scores are rule-based demo scores, not calibrated ML predictions."]

    if order_id:
        target = next((r for r in risk_scores if r.order_id == order_id), None)
        if target is None:
            return (
                f"Order {order_id} was not found among the affected orders for "
                f"disruption {disruption.id}.",
                "deterministic",
                caveats,
            )

        # Deterministic explanation
        det = _deterministic_risk_explanation_single(target, disruption)

        if llm and llm.available:
            user_prompt = _build_risk_prompt(disruption, affected, risk_scores, target)
            llm_text = llm.complete(SYSTEM_PROMPT, user_prompt)
            if llm_text:
                return llm_text, "llm", caveats

        return det, "deterministic", caveats

    # All orders
    det = _deterministic_risk_explanation_all(disruption, affected, risk_scores)

    if llm and llm.available:
        user_prompt = _build_risk_prompt(disruption, affected, risk_scores, None)
        llm_text = llm.complete(SYSTEM_PROMPT, user_prompt)
        if llm_text:
            return llm_text, "llm", caveats

    return det, "deterministic", caveats


def explain_disruption(
    disruption: Disruption,
    affected: list[Shipment],
    llm: Optional[LLMProvider] = None,
) -> tuple[str, str, list[str]]:
    """Summarize a disruption. Returns (summary, source, caveats)."""
    caveats: list[str] = []

    urgent = [s for s in affected if s.priority.value == "Urgent"]
    cold_chain = [s for s in affected if s.is_cold_chain]
    det = (
        f"Disruption {disruption.id} ({disruption.type}) is currently {disruption.status.value} "
        f"with {disruption.severity.value} severity on the {disruption.corridor}. "
        f"It affects {len(affected)} shipment(s) and {disruption.affected_orders} order(s), "
        f"with an estimated delay of {disruption.estimated_delay_hrs} hours (synthetic estimate). "
    )
    if urgent:
        det += f"{len(urgent)} order(s) are marked Urgent priority and require immediate attention. "
    if cold_chain:
        det += (
            f"{len(cold_chain)} shipment(s) contain cold-chain items that cannot tolerate "
            f"extended delays. "
        )
    det += "All data is synthetic."

    if llm and llm.available:
        user_prompt = (
            f"Summarize this disruption in 3-4 sentences for an operations manager:\n"
            f"ID: {disruption.id}\n"
            f"Type: {disruption.type}\n"
            f"Severity: {disruption.severity.value}\n"
            f"Status: {disruption.status.value}\n"
            f"Corridor: {disruption.corridor}\n"
            f"Affected shipments: {len(affected)}\n"
            f"Affected orders: {disruption.affected_orders}\n"
            f"Estimated delay: {disruption.estimated_delay_hrs}h (synthetic)\n"
            f"Urgent orders: {len(urgent)}\n"
            f"Cold-chain shipments: {len(cold_chain)}\n"
            f"Summary: {disruption.summary}\n"
            f"Note: all data is synthetic."
        )
        llm_text = llm.complete(SYSTEM_PROMPT, user_prompt)
        if llm_text:
            return llm_text, "llm", caveats

    return det, "deterministic", caveats


def explain_recovery(
    options: list[RecoveryOption],
    comparison: RecoveryComparison,
    llm: Optional[LLMProvider] = None,
) -> tuple[str, str, list[str]]:
    """Explain recovery plan trade-offs. Returns (explanation, source, caveats)."""
    caveats = [
        "All costs are synthetic estimates. No real reservations or purchases are made.",
        "Recovery plans are recommendations only — a human manager must approve before execution.",
    ]

    det = comparison.summary + "\n\n"
    for opt in options:
        det += (
            f"• {opt.strategy} ({opt.id}): {opt.feasibility}. "
            f"Protects {opt.orders_protected} order(s), "
            f"cost {opt.total_cost:,.0f} INR (synthetic), "
            f"risk {opt.risk_level.value}."
        )
        if opt.missing_information:
            det += f" Missing: {'; '.join(opt.missing_information[:2])}."
        det += "\n"

    if llm and llm.available:
        user_prompt = (
            "Explain the trade-offs between these recovery options in 4-5 sentences "
            "for an operations manager. Do not recommend auto-execution.\n\n"
        )
        for opt in options:
            user_prompt += (
                f"{opt.strategy} ({opt.id}):\n"
                f"  Feasibility: {opt.feasibility}\n"
                f"  Orders protected: {opt.orders_protected}\n"
                f"  Cost: {opt.total_cost:,.0f} INR (synthetic)\n"
                f"  Risk: {opt.risk_level.value}\n"
                f"  Missing info: {opt.missing_information}\n\n"
            )
        user_prompt += f"Comparison: {comparison.summary}\n"
        user_prompt += "Note: all costs are synthetic. No real operations are performed."

        llm_text = llm.complete(SYSTEM_PROMPT, user_prompt)
        if llm_text:
            return llm_text, "llm", caveats

    return det, "deterministic", caveats


def explain_missing_data(
    disruption: Disruption,
    risk_scores: list[RiskScore],
    options: list[RecoveryOption],
    llm: Optional[LLMProvider] = None,
) -> tuple[str, str, list[str]]:
    """Identify and explain missing information. Returns (explanation, source, caveats)."""
    caveats: list[str] = []

    gaps: list[str] = []

    # Collect missing data from risk scores
    for rs in risk_scores:
        for m in rs.missing_data:
            gaps.append(f"Order {rs.order_id}: {m}")

    # Collect missing info from recovery options
    for opt in options:
        for m in opt.missing_information:
            gaps.append(f"Option {opt.strategy}: {m}")

    # Check for unverified suppliers
    unverified = [opt for opt in options if opt.requires_supplier_verification]
    if unverified:
        gaps.append(
            f"{len(unverified)} recovery option(s) require supplier verification "
            "before they can be executed."
        )

    if not gaps:
        det = (
            "No significant data gaps detected. All key fields (SKU, ETA, priority, "
            "shipment status) are present. Supplier data is unverified but this is "
            "expected — supplier options are marked as 'Conditionally Feasible'."
        )
    else:
        det = f"{len(gaps)} data gap(s) identified:\n\n"
        for g in gaps:
            det += f"• {g}\n"
        det += "\nThese gaps affect confidence in risk scores and recovery feasibility. "
        det += "Options with missing information should not be executed until verified."

    if llm and llm.available:
        user_prompt = (
            "List and explain the missing data gaps below in plain English. "
            "Explain how each gap affects decision confidence.\n\n"
        )
        for g in gaps:
            user_prompt += f"• {g}\n"
        if not gaps:
            user_prompt += "No significant data gaps detected.\n"
        user_prompt += "\nNote: all data is synthetic."

        llm_text = llm.complete(SYSTEM_PROMPT, user_prompt)
        if llm_text:
            return llm_text, "llm", caveats

    return det, "deterministic", caveats


# ─── Deterministic helpers ─────────────────────────────────────────────


def _deterministic_risk_explanation_single(
    score: RiskScore, disruption: Disruption,
) -> str:
    lines = [
        f"Order {score.order_id} has a risk score of {score.score}/100 "
        f"(risk level: {score.risk_level.value}, confidence: {score.confidence}).",
        "",
        score.primary_reason,
        "",
        "Factor breakdown:",
    ]
    for f in score.factors:
        lines.append(
            f"  • {f.name}: {f.contribution:.1f}/100 "
            f"(weight {f.weight:.0%}, normalized {f.normalized_value:.0%}) — {f.explanation}"
        )
    if score.missing_data:
        lines.append("")
        lines.append("Missing data:")
        for m in score.missing_data:
            lines.append(f"  • {m}")
    lines.append("")
    lines.append("This is a rule-based demo score, not a calibrated ML prediction.")
    return "\n".join(lines)


def _deterministic_risk_explanation_all(
    disruption: Disruption, affected: list[Shipment], risk_scores: list[RiskScore],
) -> str:
    lines = [
        f"Risk analysis for disruption {disruption.id} ({disruption.type}).",
        f"{len(risk_scores)} affected order(s) ranked by delay risk:",
        "",
    ]
    for rs in risk_scores:
        lines.append(
            f"  {rs.order_id}: score {rs.score}/100 ({rs.risk_level.value}) — {rs.primary_reason.split('.')[0]}."
        )
    lines.append("")
    lines.append(
        "Scores are rule-based demo values computed from order priority, shipment status, "
        "disruption severity, estimated delay, cold-chain sensitivity, and data completeness. "
        "They are not calibrated ML predictions."
    )
    return "\n".join(lines)


def _build_risk_prompt(
    disruption: Disruption,
    affected: list[Shipment],
    risk_scores: list[RiskScore],
    target: Optional[RiskScore],
) -> str:
    if target:
        return (
            f"Explain the risk score for order {target.order_id} in 3-4 sentences.\n"
            f"Score: {target.score}/100 ({target.risk_level.value})\n"
            f"Primary reason: {target.primary_reason}\n"
            f"Factors: {len(target.factors)}\n"
            f"Missing data: {target.missing_data}\n"
            f"Confidence: {target.confidence}\n"
            f"Is cold-chain: {target.is_cold_chain}\n"
            f"Disruption: {disruption.id} ({disruption.severity.value}, {disruption.estimated_delay_hrs}h delay)\n"
            f"Note: all data is synthetic. Scores are rule-based, not ML predictions."
        )
    return (
        f"Explain the risk rankings for {len(risk_scores)} affected orders in 4-5 sentences.\n"
        f"Disruption: {disruption.id} ({disruption.type}, {disruption.severity.value})\n"
        f"Top 3 highest risk orders:\n"
        + "\n".join(
            f"  {rs.order_id}: {rs.score}/100 ({rs.risk_level.value})"
            for rs in risk_scores[:3]
        )
        + f"\nNote: all data is synthetic. Scores are rule-based, not ML predictions."
    )
