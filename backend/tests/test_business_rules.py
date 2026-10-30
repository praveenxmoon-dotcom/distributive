"""Tests for business rules enforcement (approval, execution, inventory)."""
import pytest

from app.engine.business_rules import (
    ApprovalViolation,
    reset_state,
    submit_plan,
    approve_plan,
    execute_plan,
    mark_material_change,
    reserve_inventory,
)
from app.models import Warehouse


class TestSubmitPlan:
    def setup_method(self):
        reset_state()

    def test_submit_creates_record(self):
        """Submitting a plan should record it as submitted."""
        record = submit_plan("RP-TEST", "v1", "priya.sharma")
        assert record.submitted is True
        assert record.proposer_id == "priya.sharma"

    def test_resubmit_same_version_is_idempotent(self):
        """Re-submitting the same version should not invalidate."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        record = submit_plan("RP-TEST", "v1", "priya.sharma")
        assert record.material_changes is False

    def test_resubmit_new_version_invalidates_approval(self):
        """Submitting a new version after approval should invalidate the prior approval."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        approve_plan("RP-TEST", "v1", "rohan.kapoor")
        # Now submit v2
        record = submit_plan("RP-TEST", "v2", "priya.sharma")
        assert record.material_changes is True
        assert record.approved is False
        assert record.validation_stale is True


class TestApprovePlan:
    def setup_method(self):
        reset_state()

    def test_approve_submitted_plan(self):
        """A manager can approve a plan submitted by someone else."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        success, violations = approve_plan("RP-TEST", "v1", "rohan.kapoor")
        assert success is True
        assert len(violations) == 0

    def test_cannot_approve_unsubmitted_plan(self):
        """A plan that was never submitted cannot be approved."""
        success, violations = approve_plan("RP-TEST", "v1", "rohan.kapoor")
        assert success is False
        assert ApprovalViolation.NOT_SUBMITTED.value in violations

    def test_proposer_cannot_approve_own_plan(self):
        """The person who proposed a plan cannot approve it."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        success, violations = approve_plan("RP-TEST", "v1", "priya.sharma")
        assert success is False
        assert ApprovalViolation.SELF_APPROVAL.value in violations

    def test_no_silent_default_manager(self):
        """Missing authentication should never silently default to a manager."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        success, violations = approve_plan("RP-TEST", "v1", "")
        assert success is False
        assert ApprovalViolation.MISSING_AUTH.value in violations

    def test_unknown_user_cannot_approve(self):
        """A user not in the system cannot approve."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        success, violations = approve_plan("RP-TEST", "v1", "random.user")
        assert success is False
        assert ApprovalViolation.NOT_AUTHORIZED.value in violations

    def test_material_change_blocks_approval(self):
        """A material change should block approval until revalidation."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        mark_material_change("RP-TEST")
        success, violations = approve_plan("RP-TEST", "v1", "rohan.kapoor")
        assert success is False
        assert ApprovalViolation.STALE_VALIDATION.value in violations


class TestExecutePlan:
    def setup_method(self):
        reset_state()

    def test_execute_approved_plan(self):
        """An approved plan can be executed."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        approve_plan("RP-TEST", "v1", "rohan.kapoor")
        success, violations = execute_plan("RP-TEST", "v1", "rohan.kapoor")
        assert success is True
        assert len(violations) == 0

    def test_cannot_execute_unapproved_plan(self):
        """A plan that was submitted but not approved cannot be executed."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        success, violations = execute_plan("RP-TEST", "v1", "rohan.kapoor")
        assert success is False
        assert ApprovalViolation.NOT_APPROVED.value in violations

    def test_cannot_execute_wrong_version(self):
        """Only the exact approved version can be executed."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        approve_plan("RP-TEST", "v1", "rohan.kapoor")
        success, violations = execute_plan("RP-TEST", "v2", "rohan.kapoor")
        assert success is False
        assert ApprovalViolation.WRONG_VERSION.value in violations

    def test_duplicate_execution_blocked(self):
        """Executing an already-executed plan should be blocked."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        approve_plan("RP-TEST", "v1", "rohan.kapoor")
        execute_plan("RP-TEST", "v1", "rohan.kapoor")
        success, violations = execute_plan("RP-TEST", "v1", "rohan.kapoor")
        assert success is False
        assert ApprovalViolation.DUPLICATE_EXECUTION.value in violations

    def test_execution_requires_auth(self):
        """Execution without authentication should be blocked."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        approve_plan("RP-TEST", "v1", "rohan.kapoor")
        success, violations = execute_plan("RP-TEST", "v1", "")
        assert success is False
        assert ApprovalViolation.MISSING_AUTH.value in violations


class TestInventoryReservation:
    def setup_method(self):
        reset_state()

    def test_reserve_available_inventory(self):
        """Reserving available inventory should succeed."""
        success, violations = reserve_inventory(
            Warehouse.chennai, "PHARMA-CP-001", 50, "RP-TEST"
        )
        assert success is True
        assert len(violations) == 0

    def test_reserve_insufficient_inventory_blocked(self):
        """Reserving more than available should be blocked."""
        success, violations = reserve_inventory(
            Warehouse.chennai, "PHARMA-CP-001", 10000, "RP-TEST"
        )
        assert success is False
        assert ApprovalViolation.INSUFFICIENT_INVENTORY.value in violations

    def test_duplicate_reservation_blocked(self):
        """The same plan cannot reserve the same SKU twice."""
        submit_plan("RP-TEST", "v1", "priya.sharma")
        reserve_inventory(Warehouse.chennai, "PHARMA-CP-001", 50, "RP-TEST")
        success, violations = reserve_inventory(
            Warehouse.chennai, "PHARMA-CP-001", 50, "RP-TEST"
        )
        assert success is False
        assert ApprovalViolation.DUPLICATE_RESERVATION.value in violations

    def test_reserve_nonexistent_sku(self):
        """Reserving a SKU that doesn't exist at a warehouse should fail."""
        success, violations = reserve_inventory(
            Warehouse.chennai, "FAKE-SKU-999", 1, "RP-TEST"
        )
        assert success is False

    def test_reservation_prevents_negative_inventory(self):
        """Two different plans should not be able to over-reserve beyond available stock."""
        # Chennai has 65 PHARMA-CP-001 units
        success1, _ = reserve_inventory(Warehouse.chennai, "PHARMA-CP-001", 60, "RP-001")
        assert success1 is True
        # Only 5 left — try to reserve 10 from a different plan
        success2, violations2 = reserve_inventory(
            Warehouse.chennai, "PHARMA-CP-001", 10, "RP-002"
        )
        assert success2 is False
        assert ApprovalViolation.INSUFFICIENT_INVENTORY.value in violations2
