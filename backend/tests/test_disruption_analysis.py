"""Tests for the disruption analysis module."""
import pytest

from app.engine import DisruptionNotFoundError, analyze_disruption
from app.data import disruptions


class TestDisruptionAnalysis:
    def test_analyze_known_disruption(self):
        """Analyzing the Delhi-Chennai breakdown should return disruption + shipments + scores."""
        disruption, affected, risk_scores = analyze_disruption("DIS-2026-0417")
        assert disruption.id == "DIS-2026-0417"
        assert len(affected) > 0
        assert len(risk_scores) == len(affected)
        # Scores should be sorted descending
        for i in range(len(risk_scores) - 1):
            assert risk_scores[i].score >= risk_scores[i + 1].score

    def test_analyze_unknown_disruption_raises(self):
        """Analyzing a non-existent disruption should raise DisruptionNotFoundError."""
        with pytest.raises(DisruptionNotFoundError):
            analyze_disruption("DIS-FAKE-9999")

    def test_all_demo_disruptions_analyze(self):
        """Every demo disruption should be analyzable without errors."""
        for d in disruptions:
            disruption, affected, risk_scores = analyze_disruption(d.id)
            assert disruption.id == d.id
            # Risk scores should be valid
            for rs in risk_scores:
                assert 0 <= rs.score <= 100

    def test_affected_shipments_linked_to_disruption(self):
        """All returned shipments should have linked_disruption_id matching."""
        disruption, affected, _ = analyze_disruption("DIS-2026-0417")
        for s in affected:
            assert s.linked_disruption_id == "DIS-2026-0417"

    def test_weather_disruption_has_fewer_affected(self):
        """The weather disruption (DIS-2026-0416) should affect fewer shipments than the breakdown."""
        _, breakdown_affected, _ = analyze_disruption("DIS-2026-0417")
        _, weather_affected, _ = analyze_disruption("DIS-2026-0416")
        assert len(weather_affected) < len(breakdown_affected)
