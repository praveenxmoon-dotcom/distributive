"""Explainable delay-risk scoring engine for affected orders.

This is a RULE-BASED DEMO scoring system — not a calibrated ML model.
The score is a transparent weighted sum of normalized factors, and every
factor carries a human-readable explanation. The `score_type` field is
always set to "rule_based_demo" so downstream consumers never mistake
this for a validated ML prediction.
"""
from __future__ import annotations

from ..models import (
    Disruption,
    DisruptionSeverity,
    RiskFactor,
    RiskLevel,
    RiskScore,
    Shipment,
    ShipmentPriority,
    ShipmentStatus,
)

# ─── Weight table ──────────────────────────────────────────────────────
# Weights sum to 1.0. Each factor is normalized to [0, 1] before
# multiplying by its weight, so the final score is always in [0, 100].

WEIGHTS = {
    "priority": 0.30,
    "shipment_status": 0.20,
    "disruption_severity": 0.20,
    "estimated_delay": 0.15,
    "cold_chain": 0.10,
    "data_completeness": 0.05,
}

PRIORITY_SCORES = {
    ShipmentPriority.urgent: 1.0,
    ShipmentPriority.high: 0.75,
    ShipmentPriority.medium: 0.50,
    ShipmentPriority.low: 0.25,
}

STATUS_SCORES = {
    ShipmentStatus.held: 1.0,
    ShipmentStatus.delayed: 0.80,
    ShipmentStatus.rerouted: 0.50,
    ShipmentStatus.in_transit: 0.30,
    ShipmentStatus.delivered: 0.0,
}

SEVERITY_SCORES = {
    DisruptionSeverity.critical: 1.0,
    DisruptionSeverity.high: 0.75,
    DisruptionSeverity.medium: 0.50,
    DisruptionSeverity.low: 0.25,
}

MAX_DELAY_HRS = 48  # normalization ceiling for estimated delay


def _normalize_delay(delay_hrs: int) -> float:
    """Normalize delay hours to [0, 1] with a 48h ceiling."""
    return min(delay_hrs / MAX_DELAY_HRS, 1.0) if delay_hrs > 0 else 0.0


def _score_to_level(score: int) -> RiskLevel:
    if score >= 80:
        return RiskLevel.critical
    if score >= 60:
        return RiskLevel.high
    if score >= 35:
        return RiskLevel.medium
    return RiskLevel.low


def _confidence(missing: list[str]) -> str:
    if len(missing) == 0:
        return "High"
    if len(missing) <= 2:
        return "Medium"
    return "Low"


def score_order(
    shipment: Shipment,
    disruption: Disruption,
) -> RiskScore:
    """Compute an explainable risk score for a single shipment/order.

    Every factor is returned with its raw value, normalized value, weight,
    contribution, and a human-readable explanation so the score is fully
    auditable.
    """
    factors: list[RiskFactor] = []
    missing_data: list[str] = []

    # 1. Priority
    priority_raw = PRIORITY_SCORES.get(shipment.priority, 0.5)
    factors.append(RiskFactor(
        name="Order Priority",
        weight=WEIGHTS["priority"],
        raw_value=priority_raw,
        normalized_value=priority_raw,
        contribution=priority_raw * WEIGHTS["priority"] * 100,
        explanation=f"Order priority is {shipment.priority.value}, "
        f"mapped to {priority_raw:.0%} of max priority weight.",
    ))

    # 2. Shipment status
    status_raw = STATUS_SCORES.get(shipment.status, 0.5)
    factors.append(RiskFactor(
        name="Shipment Status",
        weight=WEIGHTS["shipment_status"],
        raw_value=status_raw,
        normalized_value=status_raw,
        contribution=status_raw * WEIGHTS["shipment_status"] * 100,
        explanation=f"Shipment is currently '{shipment.status.value}', "
        f"which indicates {'severe' if status_raw >= 0.8 else 'moderate' if status_raw >= 0.5 else 'low'} operational impact.",
    ))

    # 3. Disruption severity
    sev_raw = SEVERITY_SCORES.get(disruption.severity, 0.5)
    factors.append(RiskFactor(
        name="Disruption Severity",
        weight=WEIGHTS["disruption_severity"],
        raw_value=sev_raw,
        normalized_value=sev_raw,
        contribution=sev_raw * WEIGHTS["disruption_severity"] * 100,
        explanation=f"Linked disruption {disruption.id} has severity '{disruption.severity.value}'.",
    ))

    # 4. Estimated delay
    delay_raw = disruption.estimated_delay_hrs
    delay_norm = _normalize_delay(delay_raw)
    factors.append(RiskFactor(
        name="Estimated Delay",
        weight=WEIGHTS["estimated_delay"],
        raw_value=delay_raw,
        normalized_value=delay_norm,
        contribution=delay_norm * WEIGHTS["estimated_delay"] * 100,
        explanation=f"Estimated delay is {delay_raw}h "
        f"(normalized to {delay_norm:.0%} against a {MAX_DELAY_HRS}h ceiling). "
        f"This is a synthetic estimate, not a confirmed delay.",
    ))

    # 5. Cold-chain sensitivity
    cold_raw = 1.0 if shipment.is_cold_chain else 0.0
    if shipment.is_cold_chain:
        factors.append(RiskFactor(
            name="Cold-Chain Sensitivity",
            weight=WEIGHTS["cold_chain"],
            raw_value=cold_raw,
            normalized_value=cold_raw,
            contribution=cold_raw * WEIGHTS["cold_chain"] * 100,
            explanation="Order contains cold-chain items that cannot tolerate extended delays.",
        ))
    else:
        factors.append(RiskFactor(
            name="Cold-Chain Sensitivity",
            weight=WEIGHTS["cold_chain"],
            raw_value=cold_raw,
            normalized_value=cold_raw,
            contribution=0.0,
            explanation="Order does not contain cold-chain items.",
        ))

    # 6. Data completeness — penalize missing fields
    missing = []
    if not shipment.sku:
        missing.append("SKU not specified for shipment — inventory matching is incomplete.")
    if not shipment.eta:
        missing.append("ETA not available — deadline urgency cannot be precisely assessed.")
    if disruption.estimated_delay_hrs <= 0:
        missing.append("Estimated delay is zero or missing — delay impact may be underestimated.")

    completeness = 1.0 - (len(missing) * 0.25)  # each missing field costs 25%
    completeness = max(completeness, 0.0)
    factors.append(RiskFactor(
        name="Data Completeness",
        weight=WEIGHTS["data_completeness"],
        raw_value=float(len(missing)),
        normalized_value=completeness,
        contribution=completeness * WEIGHTS["data_completeness"] * 100,
        explanation=f"{len(missing)} data gap(s) detected. "
        + ("All key fields are present." if len(missing) == 0 else "See missing_data for details."),
    ))

    missing_data.extend(missing)

    # ─── Aggregate ─────────────────────────────────────────────────────
    raw_score = sum(f.contribution for f in factors)
    score = round(raw_score)
    score = max(0, min(100, score))

    risk_level = _score_to_level(score)
    confidence = _confidence(missing_data)

    # Primary reason: the factor with the highest contribution
    top_factor = max(factors, key=lambda f: f.contribution)
    primary_reason = (
        f"Primary risk driver: {top_factor.name} "
        f"(contribution: {top_factor.contribution:.1f}/100). "
        f"{top_factor.explanation}"
    )

    return RiskScore(
        order_id=shipment.order_id,
        shipment_id=shipment.id,
        score=score,
        score_type="rule_based_demo",
        risk_level=risk_level,
        factors=factors,
        primary_reason=primary_reason,
        confidence=confidence,
        missing_data=missing_data,
        is_cold_chain=shipment.is_cold_chain,
    )


def score_orders(
    affected_shipments: list[Shipment],
    disruption: Disruption,
) -> list[RiskScore]:
    """Score and rank all affected shipments by delay risk (highest first)."""
    scores = [score_order(s, disruption) for s in affected_shipments]
    scores.sort(key=lambda r: r.score, reverse=True)
    return scores
