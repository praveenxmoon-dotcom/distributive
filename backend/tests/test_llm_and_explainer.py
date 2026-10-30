"""Tests for the LLM provider interface and explainer module."""
from app.llm import NoOpProvider, create_provider
from app.engine.explainer import (
    explain_risk,
    explain_disruption,
    explain_recovery,
    explain_missing_data,
)
from app.engine import analyze_disruption, generate_recovery_options, compare_options


class TestLLMProvider:
    def test_noop_provider_when_not_configured(self):
        """With provider='none', a NoOpProvider should be returned."""
        provider = create_provider()
        # Default config has provider='none'
        assert provider.available is False

    def test_noop_returns_empty_string(self):
        """NoOpProvider.complete should return empty string."""
        provider = NoOpProvider()
        result = provider.complete("system", "user")
        assert result == ""


class TestExplainerDeterministic:
    def test_explain_risk_all_orders(self):
        """Deterministic risk explanation should include order IDs and scores."""
        disruption, affected, risk_scores = analyze_disruption("DIS-2026-0417")
        explanation, source, caveats = explain_risk(
            disruption, affected, risk_scores, llm=None,
        )
        assert source == "deterministic"
        assert "rule-based" in explanation.lower()
        assert any(c.order_id in explanation for c in risk_scores)
        assert len(caveats) > 0

    def test_explain_risk_single_order(self):
        """Deterministic risk explanation for a specific order should include its score."""
        disruption, affected, risk_scores = analyze_disruption("DIS-2026-0417")
        target = risk_scores[0]
        explanation, source, _ = explain_risk(
            disruption, affected, risk_scores, order_id=target.order_id, llm=None,
        )
        assert source == "deterministic"
        assert target.order_id in explanation
        assert str(target.score) in explanation

    def test_explain_risk_unknown_order(self):
        """Explaining a non-existent order should return a clear message."""
        disruption, affected, risk_scores = analyze_disruption("DIS-2026-0417")
        explanation, source, _ = explain_risk(
            disruption, affected, risk_scores, order_id="ORD-FAKE", llm=None,
        )
        assert "not found" in explanation.lower()

    def test_explain_disruption(self):
        """Deterministic disruption summary should mention the disruption ID and affected counts."""
        disruption, affected, _ = analyze_disruption("DIS-2026-0417")
        explanation, source, _ = explain_disruption(disruption, affected, llm=None)
        assert source == "deterministic"
        assert disruption.id in explanation
        assert "synthetic" in explanation.lower()

    def test_explain_recovery(self):
        """Recovery explanation should mention options and their trade-offs."""
        disruption, affected, _ = analyze_disruption("DIS-2026-0417")
        options = generate_recovery_options(disruption, affected)
        comparison = compare_options(options)
        explanation, source, caveats = explain_recovery(options, comparison, llm=None)
        assert source == "deterministic"
        assert len(caveats) >= 2
        # Should mention at least one strategy name
        assert any(opt.strategy in explanation for opt in options)

    def test_explain_missing_data(self):
        """Missing data explanation should list data gaps."""
        disruption, affected, risk_scores = analyze_disruption("DIS-2026-0417")
        options = generate_recovery_options(disruption, affected)
        explanation, source, _ = explain_missing_data(
            disruption, risk_scores, options, llm=None,
        )
        assert source == "deterministic"
        # Should mention gaps or confirm no significant gaps
        assert len(explanation) > 20

    def test_explain_with_noop_llm_falls_back_to_deterministic(self):
        """When LLM is NoOp, explanations should fall back to deterministic."""
        disruption, affected, risk_scores = analyze_disruption("DIS-2026-0417")
        llm = NoOpProvider()
        explanation, source, _ = explain_risk(
            disruption, affected, risk_scores, llm=llm,
        )
        assert source == "deterministic"
        assert explanation  # non-empty
