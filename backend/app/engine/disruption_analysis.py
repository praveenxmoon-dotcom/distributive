"""Disruption analysis module.

Identifies affected shipments/orders for a given disruption and produces
risk-ranked output using the risk engine.
"""
from __future__ import annotations

from ..data import (
    get_disruption,
    get_shipments_for_disruption,
)
from ..models import Disruption, RiskScore, Shipment
from .risk_engine import score_orders


class DisruptionNotFoundError(Exception):
    def __init__(self, disruption_id: str):
        self.disruption_id = disruption_id
        super().__init__(f"Disruption '{disruption_id}' not found")


def analyze_disruption(disruption_id: str) -> tuple[Disruption, list[Shipment], list[RiskScore]]:
    """Analyze a disruption: identify affected shipments and score them.

    Returns:
        Tuple of (disruption, affected_shipments, risk_scores_sorted_desc).

    Raises:
        DisruptionNotFoundError: if the disruption_id does not exist.
    """
    disruption = get_disruption(disruption_id)
    if disruption is None:
        raise DisruptionNotFoundError(disruption_id)

    affected = get_shipments_for_disruption(disruption_id)
    risk_scores = score_orders(affected, disruption)

    return disruption, affected, risk_scores
