"""Tests for the explainable risk scoring engine."""
from app.engine.risk_engine import score_order, score_orders
from app.data import disruptions, shipments
from app.models import (
    DisruptionSeverity,
    DisruptionStatus,
    Disruption,
    RiskLevel,
    ShipmentPriority,
    ShipmentStatus,
    Shipment,
)


def _make_disruption(**overrides) -> Disruption:
    defaults = dict(
        id="DIS-TEST",
        type="Test Disruption",
        status=DisruptionStatus.active,
        severity=DisruptionSeverity.critical,
        corridor="Test Corridor",
        origin="Delhi Warehouse",
        destination="Chennai Warehouse",
        affected_shipments=5,
        affected_orders=10,
        estimated_delay_hrs=26,
        detected_at="2026-10-29 06:42 IST",
        summary="Test disruption",
        timeline=[],
    )
    defaults.update(overrides)
    return Disruption(**defaults)


def _make_shipment(**overrides) -> Shipment:
    defaults = dict(
        id="SHP-TEST",
        origin="Delhi Warehouse",
        destination="Chennai Warehouse",
        status=ShipmentStatus.delayed,
        priority=ShipmentPriority.urgent,
        carrier="TestCarrier",
        eta="2026-10-31 14:00",
        delay_risk=90,
        customer_impact="High — test",
        order_id="ORD-TEST",
        linked_disruption_id="DIS-TEST",
        is_cold_chain=False,
        quantity=10,
        sku="PHARMA-CP-001",
    )
    defaults.update(overrides)
    return Shipment(**defaults)


class TestRiskScoring:
    def test_urgent_cold_chain_delayed_scores_high(self):
        """An urgent, cold-chain, delayed shipment on a critical disruption should score high."""
        disruption = _make_disruption()
        shipment = _make_shipment(
            priority=ShipmentPriority.urgent,
            status=ShipmentStatus.held,
            is_cold_chain=True,
        )
        result = score_order(shipment, disruption)
        assert result.score >= 70, f"Expected score >= 70, got {result.score}"
        assert result.risk_level in (RiskLevel.critical, RiskLevel.high)
        assert result.score_type == "rule_based_demo"
        assert result.is_cold_chain is True

    def test_low_priority_delivered_scores_low(self):
        """A low-priority, delivered shipment should score very low."""
        disruption = _make_disruption(severity=DisruptionSeverity.low, estimated_delay_hrs=2)
        shipment = _make_shipment(
            priority=ShipmentPriority.low,
            status=ShipmentStatus.delivered,
            is_cold_chain=False,
        )
        result = score_order(shipment, disruption)
        assert result.score < 30, f"Expected score < 30, got {result.score}"
        assert result.risk_level in (RiskLevel.low, RiskLevel.medium)

    def test_score_is_in_range(self):
        """Score must always be between 0 and 100."""
        disruption = _make_disruption()
        for priority in ShipmentPriority:
            for status in ShipmentStatus:
                shipment = _make_shipment(priority=priority, status=status)
                result = score_order(shipment, disruption)
                assert 0 <= result.score <= 100

    def test_factors_are_explainable(self):
        """Every risk score must have factors with explanations."""
        disruption = _make_disruption()
        shipment = _make_shipment()
        result = score_order(shipment, disruption)
        assert len(result.factors) == 6
        for f in result.factors:
            assert f.name  # non-empty
            assert f.explanation  # non-empty
            assert 0 <= f.normalized_value <= 1.0
            assert f.weight > 0
            assert f.contribution >= 0

    def test_missing_data_lowers_confidence(self):
        """Missing SKU should appear in missing_data and lower confidence."""
        disruption = _make_disruption()
        shipment = _make_shipment(sku=None)
        result = score_order(shipment, disruption)
        assert len(result.missing_data) > 0
        assert result.confidence in ("Medium", "Low")

    def test_cold_chain_increases_score(self):
        """Cold-chain shipments should score higher than non-cold-chain with same other factors."""
        disruption = _make_disruption()
        cold = _make_shipment(is_cold_chain=True)
        non_cold = _make_shipment(is_cold_chain=False)
        score_cold = score_order(cold, disruption).score
        score_non_cold = score_order(non_cold, disruption).score
        assert score_cold > score_non_cold

    def test_higher_severity_increases_score(self):
        """A critical disruption should produce higher scores than a low one."""
        ship = _make_shipment()
        critical = _make_disruption(severity=DisruptionSeverity.critical)
        low = _make_disruption(severity=DisruptionSeverity.low)
        assert score_order(ship, critical).score > score_order(ship, low).score

    def test_score_orders_sorts_descending(self):
        """score_orders should return scores sorted highest-first."""
        disruption = _make_disruption()
        ships = [
            _make_shipment(id="S1", order_id="O1", priority=ShipmentPriority.low, status=ShipmentStatus.in_transit),
            _make_shipment(id="S2", order_id="O2", priority=ShipmentPriority.urgent, status=ShipmentStatus.held, is_cold_chain=True),
            _make_shipment(id="S3", order_id="O3", priority=ShipmentPriority.medium, status=ShipmentStatus.delayed),
        ]
        scores = score_orders(ships, disruption)
        assert scores[0].score >= scores[1].score >= scores[2].score

    def test_primary_reason_present(self):
        """Every risk score must have a primary_reason."""
        disruption = _make_disruption()
        shipment = _make_shipment()
        result = score_order(shipment, disruption)
        assert result.primary_reason
        assert "Primary risk driver" in result.primary_reason
