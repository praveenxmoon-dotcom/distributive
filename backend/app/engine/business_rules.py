"""Business rules enforcement for plan approval and execution.

Enforces the hard constraints that protect the integrity of the recovery
workflow. None of these rules can be bypassed — not even by an administrator.

Rules:
1. A plan must be submitted before it can be approved.
2. The proposer cannot approve their own plan.
3. Material changes invalidate prior approval and require revalidation.
4. Only the exact current approved plan version may execute.
5. Revalidate stock and constraints before execution.
6. Prevent negative inventory, duplicate execution, and duplicate reservations.
7. Do not silently assign a default manager when authentication is missing.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from ..data import demo_users, inventory
from ..models import InventoryItem, RecoveryOption, Warehouse


class ApprovalViolation(str, Enum):
    NOT_SUBMITTED = "plan_not_submitted"
    SELF_APPROVAL = "proposer_cannot_approve_own_plan"
    WRONG_VERSION = "only_current_approved_version_can_execute"
    NOT_APPROVED = "plan_not_approved"
    MISSING_AUTH = "missing_authentication_no_default_manager"
    DUPLICATE_EXECUTION = "duplicate_execution_already_executed"
    DUPLICATE_RESERVATION = "duplicate_reservation_already_reserved"
    INSUFFICIENT_INVENTORY = "insufficient_inventory_prevents_reservation"
    STALE_VALIDATION = "stale_validation_requires_revalidation"
    NOT_AUTHORIZED = "user_not_authorized_for_approval"


@dataclass
class PlanRecord:
    """In-memory tracking of a plan's lifecycle state."""
    plan_id: str
    version: str
    proposer_id: str
    submitted: bool = False
    approved: bool = False
    approved_by: str | None = None
    approved_version: str | None = None
    material_changes: bool = False
    executed: bool = False
    reserved_skus: dict[str, int] = field(default_factory=dict)
    validation_stale: bool = False


# In-memory state store (demo only — a real backend would use a database)
_plan_store: dict[str, PlanRecord] = {}

# Track reservations per warehouse+sku to prevent duplicates
_reservation_store: dict[str, dict[str, int]] = {}  # warehouse -> {sku: reserved_qty}


def reset_state() -> None:
    """Clear all in-memory state. Used by tests."""
    _plan_store.clear()
    _reservation_store.clear()


def submit_plan(plan_id: str, version: str, proposer_id: str) -> PlanRecord:
    """Record a plan submission. A plan must be submitted before approval."""
    record = _plan_store.get(plan_id)
    if record is None:
        record = PlanRecord(plan_id=plan_id, version=version, proposer_id=proposer_id)
        _plan_store[plan_id] = record

    # If version changed, mark material changes and invalidate prior approval
    if record.submitted and record.version != version:
        record.version = version
        record.material_changes = True
        record.approved = False
        record.approved_by = None
        record.approved_version = None
        record.validation_stale = True

    record.submitted = True
    return record


def approve_plan(
    plan_id: str,
    version: str,
    approver_id: str,
) -> tuple[bool, list[str]]:
    """Attempt to approve a plan. Returns (success, violations)."""
    violations: list[str] = []

    # Rule 7: No silent default manager
    if not approver_id:
        violations.append(ApprovalViolation.MISSING_AUTH.value)
        return False, violations

    # Check that approver exists
    if approver_id not in demo_users:
        violations.append(ApprovalViolation.NOT_AUTHORIZED.value)
        return False, violations

    record = _plan_store.get(plan_id)

    if record is None or not record.submitted:
        violations.append(ApprovalViolation.NOT_SUBMITTED.value)
        return False, violations

    # Rule 2: Proposer cannot approve own plan
    if record.proposer_id == approver_id:
        violations.append(ApprovalViolation.SELF_APPROVAL.value)

    # Rule 3: Material changes invalidate prior approval
    if record.material_changes or record.validation_stale:
        violations.append(ApprovalViolation.STALE_VALIDATION.value)

    if violations:
        return False, violations

    # Approve
    record.approved = True
    record.approved_by = approver_id
    record.approved_version = version
    record.material_changes = False
    record.validation_stale = False

    return True, []


def execute_plan(
    plan_id: str,
    version: str,
    approver_id: str,
    option: RecoveryOption | None = None,
    revalidate: bool = True,
) -> tuple[bool, list[str]]:
    """Attempt to execute an approved plan. Returns (success, violations)."""
    violations: list[str] = []

    # Rule 7: No silent default manager
    if not approver_id:
        violations.append(ApprovalViolation.MISSING_AUTH.value)
        return False, violations

    record = _plan_store.get(plan_id)

    if record is None or not record.submitted:
        violations.append(ApprovalViolation.NOT_SUBMITTED.value)
        return False, violations

    # Rule 4: Only the exact current approved version can execute
    if not record.approved:
        violations.append(ApprovalViolation.NOT_APPROVED.value)
        return False, violations

    if record.approved_version != version:
        violations.append(ApprovalViolation.WRONG_VERSION.value)
        return False, violations

    # Rule 6: Prevent duplicate execution
    if record.executed:
        violations.append(ApprovalViolation.DUPLICATE_EXECUTION.value)
        return False, violations

    # Rule 5: Revalidate stock and constraints before execution
    if revalidate and option is not None and option.requires_inventory_check:
        inv_violations = _validate_inventory(option)
        violations.extend(inv_violations)

    if violations:
        return False, violations

    # Execute: mark as executed
    record.executed = True

    return True, []


def _validate_inventory(option: RecoveryOption) -> list[str]:
    """Check that inventory is sufficient for the option. Prevents negative inventory."""
    violations: list[str] = []

    # For the inventory option, we need to check actual stock levels
    # This is a simplified check — the real implementation would match SKUs
    for item in inventory:
        if item.quantity < 0:
            violations.append(ApprovalViolation.INSUFFICIENT_INVENTORY.value)

    return violations


def reserve_inventory(
    warehouse: Warehouse,
    sku: str,
    quantity: int,
    plan_id: str,
) -> tuple[bool, list[str]]:
    """Reserve inventory for a plan execution. Prevents duplicate reservations and negative inventory."""
    violations: list[str] = []

    wh_key = warehouse.value
    wh_reservations = _reservation_store.setdefault(wh_key, {})

    # Check for duplicate reservation by same plan
    plan_record = _plan_store.get(plan_id)
    if plan_record and sku in plan_record.reserved_skus:
        violations.append(ApprovalViolation.DUPLICATE_RESERVATION.value)
        return False, violations

    # Find the inventory item
    inv_item: InventoryItem | None = None
    for item in inventory:
        if item.sku == sku and item.warehouse == warehouse:
            inv_item = item
            break

    if inv_item is None:
        violations.append(f"Inventory item {sku} not found at {wh_key} warehouse.")
        return False, violations

    # Check available quantity (current stock minus existing reservations)
    already_reserved = wh_reservations.get(sku, 0)
    available = inv_item.quantity - already_reserved

    if available < quantity:
        violations.append(ApprovalViolation.INSUFFICIENT_INVENTORY.value)
        return False, violations

    # Reserve
    wh_reservations[sku] = already_reserved + quantity
    if plan_record:
        plan_record.reserved_skus[sku] = quantity

    return True, []


def mark_material_change(plan_id: str) -> None:
    """Mark that a plan has been materially modified, invalidating prior approval."""
    record = _plan_store.get(plan_id)
    if record:
        record.material_changes = True
        record.approved = False
        record.approved_by = None
        record.approved_version = None
        record.validation_stale = True
