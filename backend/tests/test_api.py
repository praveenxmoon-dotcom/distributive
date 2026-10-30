"""Tests for the FastAPI API endpoints."""
import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestHealth:
    def test_root(self, client):
        r = client.get("/")
        assert r.status_code == 200
        data = r.json()
        assert data["service"] == "DisruptionIQ Decision Intelligence Engine"
        assert data["synthetic"] is True

    def test_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestAnalyzeDisruption:
    def test_analyze_known(self, client):
        r = client.post("/api/decision/analyze-disruption", json={
            "disruption_id": "DIS-2026-0417",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["disruption"]["id"] == "DIS-2026-0417"
        assert len(data["affected_orders"]) > 0
        assert len(data["risk_scores"]) > 0
        assert data["synthetic"] is True
        assert data["llm_available"] is False  # no LLM configured

    def test_analyze_unknown_returns_404(self, client):
        r = client.post("/api/decision/analyze-disruption", json={
            "disruption_id": "DIS-FAKE-9999",
        })
        assert r.status_code == 404

    def test_analyze_missing_field_returns_422(self, client):
        r = client.post("/api/decision/analyze-disruption", json={})
        assert r.status_code == 422


class TestAffectedOrders:
    def test_get_affected_orders_known(self, client):
        r = client.get("/api/decision/affected-orders/DIS-2026-0417")
        assert r.status_code == 200
        data = r.json()
        assert data["disruption_exists"] is True
        assert data["total_orders"] > 0
        assert data["synthetic"] is True

    def test_get_affected_orders_unknown(self, client):
        r = client.get("/api/decision/affected-orders/DIS-FAKE-9999")
        assert r.status_code == 200
        data = r.json()
        assert data["disruption_exists"] is False
        assert data["total_orders"] == 0


class TestRecommendRecovery:
    def test_recommend_for_known_disruption(self, client):
        r = client.post("/api/decision/recommend-recovery", json={
            "disruption_id": "DIS-2026-0417",
        })
        assert r.status_code == 200
        data = r.json()
        assert len(data["options"]) > 0
        assert data["comparison"]["summary"]
        assert data["synthetic"] is True

    def test_recommend_excludes_infeasible(self, client):
        r = client.post("/api/decision/recommend-recovery", json={
            "disruption_id": "DIS-2026-0417",
            "include_infeasible": False,
        })
        assert r.status_code == 200
        data = r.json()
        for opt in data["options"]:
            assert opt["feasibility"] != "Infeasible"

    def test_recommend_unknown_returns_404(self, client):
        r = client.post("/api/decision/recommend-recovery", json={
            "disruption_id": "DIS-FAKE",
        })
        assert r.status_code == 404


class TestExplain:
    def test_explain_risk(self, client):
        r = client.post("/api/decision/explain", json={
            "topic": "risk",
            "disruption_id": "DIS-2026-0417",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["topic"] == "risk"
        assert data["source"] == "deterministic"
        assert len(data["explanation"]) > 0
        assert len(data["caveats"]) > 0

    def test_explain_disruption(self, client):
        r = client.post("/api/decision/explain", json={
            "topic": "disruption",
            "disruption_id": "DIS-2026-0417",
        })
        assert r.status_code == 200
        data = r.json()
        assert "DIS-2026-0417" in data["explanation"]

    def test_explain_recovery(self, client):
        r = client.post("/api/decision/explain", json={
            "topic": "recovery",
            "disruption_id": "DIS-2026-0417",
        })
        assert r.status_code == 200
        data = r.json()
        assert len(data["explanation"]) > 0

    def test_explain_missing_data(self, client):
        r = client.post("/api/decision/explain", json={
            "topic": "missing_data",
            "disruption_id": "DIS-2026-0417",
        })
        assert r.status_code == 200

    def test_explain_invalid_topic(self, client):
        r = client.post("/api/decision/explain", json={
            "topic": "invalid_topic",
        })
        assert r.status_code == 422


class TestPlanLifecycle:
    def test_full_lifecycle(self, client):
        """Submit → Approve → Execute should succeed for a valid flow."""
        # Submit
        r = client.post("/api/decision/submit-plan", json={
            "plan_id": "RP-LIFECYCLE",
            "version": "v1",
            "proposer_id": "priya.sharma",
        })
        assert r.status_code == 200
        assert r.json()["success"] is True

        # Approve by a different manager
        r = client.post("/api/decision/approve-plan", json={
            "plan_id": "RP-LIFECYCLE",
            "version": "v1",
            "approver_id": "rohan.kapoor",
        })
        assert r.status_code == 200
        assert r.json()["success"] is True

        # Execute
        r = client.post("/api/decision/execute-plan", json={
            "plan_id": "RP-LIFECYCLE",
            "version": "v1",
            "approver_id": "rohan.kapoor",
        })
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_self_approval_blocked(self, client):
        """Proposer cannot approve their own plan."""
        client.post("/api/decision/submit-plan", json={
            "plan_id": "RP-SELF",
            "version": "v1",
            "proposer_id": "priya.sharma",
        })
        r = client.post("/api/decision/approve-plan", json={
            "plan_id": "RP-SELF",
            "version": "v1",
            "approver_id": "priya.sharma",
        })
        assert r.json()["success"] is False
        assert "proposer_cannot_approve_own_plan" in r.json()["violations"]

    def test_unsubmitted_approval_blocked(self, client):
        """Cannot approve a plan that was never submitted."""
        r = client.post("/api/decision/approve-plan", json={
            "plan_id": "RP-UNSUB",
            "version": "v1",
            "approver_id": "rohan.kapoor",
        })
        assert r.json()["success"] is False
        assert "plan_not_submitted" in r.json()["violations"]

    def test_missing_auth_blocked(self, client):
        """Missing authentication should be blocked — no silent default manager."""
        client.post("/api/decision/submit-plan", json={
            "plan_id": "RP-NOAUTH",
            "version": "v1",
            "proposer_id": "priya.sharma",
        })
        r = client.post("/api/decision/approve-plan", json={
            "plan_id": "RP-NOAUTH",
            "version": "v1",
            "approver_id": "",
        })
        assert r.json()["success"] is False
        assert "missing_authentication_no_default_manager" in r.json()["violations"]

    def test_duplicate_execution_blocked(self, client):
        """Cannot execute the same plan twice."""
        client.post("/api/decision/submit-plan", json={
            "plan_id": "RP-DUP",
            "version": "v1",
            "proposer_id": "priya.sharma",
        })
        client.post("/api/decision/approve-plan", json={
            "plan_id": "RP-DUP",
            "version": "v1",
            "approver_id": "rohan.kapoor",
        })
        client.post("/api/decision/execute-plan", json={
            "plan_id": "RP-DUP",
            "version": "v1",
            "approver_id": "rohan.kapoor",
        })
        r = client.post("/api/decision/execute-plan", json={
            "plan_id": "RP-DUP",
            "version": "v1",
            "approver_id": "rohan.kapoor",
        })
        assert r.json()["success"] is False
        assert "duplicate_execution_already_executed" in r.json()["violations"]

    def test_wrong_version_execution_blocked(self, client):
        """Cannot execute a version different from the approved one."""
        client.post("/api/decision/submit-plan", json={
            "plan_id": "RP-VER",
            "version": "v1",
            "proposer_id": "priya.sharma",
        })
        client.post("/api/decision/approve-plan", json={
            "plan_id": "RP-VER",
            "version": "v1",
            "approver_id": "rohan.kapoor",
        })
        r = client.post("/api/decision/execute-plan", json={
            "plan_id": "RP-VER",
            "version": "v2",
            "approver_id": "rohan.kapoor",
        })
        assert r.json()["success"] is False
        assert "only_current_approved_version_can_execute" in r.json()["violations"]
